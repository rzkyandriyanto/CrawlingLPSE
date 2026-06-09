import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";
import { UserModel } from "@/models/User";
import { KOTA_PROVINSI_MAP, ADJACENCY_MAP, ISLANDS } from "@/lib/geoMap";

// ─── Hitung skor relevansi singkat (untuk filter notif) ──────────────────────
function calcRelevanceScore(tender: any, userProfile: any): number {
  if (!userProfile) return 0;
  let score = 0;
  const wilayah = (tender.wilayah || "").toLowerCase();
  const instansi = (tender.instansi || "").toLowerCase();
  const namaPaket = (tender.nama_paket || "").toLowerCase();
  const kategori = (tender.kategori || "");
  const tagTender = (tender.tag || "");
  const tenderStr = wilayah + " " + instansi;

  if (userProfile.provinsi) {
    const pUser = userProfile.provinsi.toLowerCase();
    let tenderProv = "";
    for (const [key, val] of Object.entries(KOTA_PROVINSI_MAP)) {
      if (tenderStr.includes(key.toLowerCase())) { tenderProv = (val as string).toLowerCase(); break; }
    }
    if (!tenderProv) {
      for (const p of Object.keys(ADJACENCY_MAP)) {
        if (tenderStr.includes(p)) { tenderProv = p; break; }
      }
    }
    if (tenderProv === pUser) score += 40;
    else if (ADJACENCY_MAP[pUser]?.includes(tenderProv)) score += 20;
    else {
      for (const [, provs] of Object.entries(ISLANDS)) {
        if ((provs as string[]).includes(pUser) && (provs as string[]).includes(tenderProv)) { score += 10; break; }
      }
    }
  }
  if ((userProfile.bidang_minat || []).some((b: string) =>
    kategori.toLowerCase().includes(b.toLowerCase()) ||
    tagTender.toLowerCase().includes(b.toLowerCase()) ||
    namaPaket.includes(b.toLowerCase())
  )) score += 20;
  if ((userProfile.topKategori || []).includes(kategori)) score += 15;
  if ((userProfile.topTags || []).includes(tagTender)) score += 15;
  let kwHits = 0;
  (userProfile.topKeywords || []).forEach((kw: string) => {
    if (kw.length > 2 && namaPaket.includes(kw.toLowerCase())) kwHits++;
  });
  score += Math.min(kwHits * 10, 30);
  return Math.min(score, 100);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const since = searchParams.get("since"); // ISO timestamp
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // default: 7 hari lalu

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    await connectToDatabase();

    // ── Ambil profil user ──────────────────────────────────────────────────
    const userDoc = await UserModel.findById(userId).select("provinsi bidang_minat search_history").lean() as any;
    if (!userDoc) return NextResponse.json({ newTenders: [], pinnedUpdates: [] });

    const pinnedTenders = await TenderModel.find(
      { pinned_by_users: String(userId) },
      { kategori: 1, tag: 1, wilayah: 1 }
    ).lean();

    const katCount: Record<string, number> = {};
    const tagCount: Record<string, number> = {};
    for (const pt of pinnedTenders) {
      const k = (pt as any).kategori; const t = (pt as any).tag;
      if (k) katCount[k] = (katCount[k] || 0) + 1;
      if (t) tagCount[t] = (tagCount[t] || 0) + 1;
    }

    const userProfile = {
      provinsi: userDoc.provinsi || "",
      bidang_minat: userDoc.bidang_minat || [],
      topKategori: Object.entries(katCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k),
      topTags: Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t]) => t),
      topKeywords: Array.from(new Set([...(userDoc.search_history || [])].reverse())).slice(0, 10),
    };

    // ── 1. TENDER BARU yang relevan ──────────────────────────────────────────
    const newTenderDocs = await TenderModel.find(
      { createdAt: { $gt: sinceDate }, status: "aktif" },
      { nama_paket: 1, instansi: 1, wilayah: 1, kategori: 1, tag: 1, pagu: 1, lelangId: 1, url_lpse: 1, createdAt: 1 }
    ).limit(50).lean();

    const newTenders = newTenderDocs
      .map((t: any) => ({ ...t, score: calcRelevanceScore(t, userProfile) }))
      .filter((t: any) => t.score >= 50) // Hanya yang relevan (skor >= 50)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5)
      .map((t: any) => ({
        id: t._id.toString(),
        type: "new_tender" as const,
        title: t.nama_paket,
        instansi: t.instansi,
        wilayah: t.wilayah,
        pagu: t.pagu,
        score: t.score,
        lelangId: t.lelangId,
        url_lpse: t.url_lpse,
        createdAt: t.createdAt,
      }));

    // ── 2. UPDATE JADWAL pada tender yang sudah di-Pin ────────────────────────
    const pinnedIds = pinnedTenders.map((p: any) => p._id);
    const updatedPinnedDocs = await TenderModel.find(
      {
        _id: { $in: pinnedIds },
        updatedAt: { $gt: sinceDate },
      },
      { nama_paket: 1, instansi: 1, jadwal: 1, lelangId: 1, url_lpse: 1, updatedAt: 1 }
    ).lean();

    const pinnedUpdates = updatedPinnedDocs.map((t: any) => {
      // Ambil tahap terkini (jadwal terakhir yang ada)
      const lastJadwal = (t.jadwal || []).slice(-1)[0];
      return {
        id: t._id.toString(),
        type: "schedule_update" as const,
        title: t.nama_paket,
        instansi: t.instansi,
        tahap: lastJadwal?.tahap || "Diperbarui",
        lelangId: t.lelangId,
        url_lpse: t.url_lpse,
        updatedAt: t.updatedAt,
      };
    });

    return NextResponse.json({ newTenders, pinnedUpdates });
  } catch (err) {
    console.error("[notifications] Error:", err);
    return NextResponse.json({ newTenders: [], pinnedUpdates: [] }, { status: 500 });
  }
}
