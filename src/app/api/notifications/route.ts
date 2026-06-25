import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";
import { UserModel } from "@/models/User";
import { KOTA_PROVINSI_MAP, ADJACENCY_MAP, ISLANDS } from "@/lib/geoMap";

// ─── Hitung skor relevansi (untuk filter notif) ───────────────────────────
// MODE 1 (Tanpa CP): pakai algoritma wilayah dari profil user (kota/provinsi)
// MODE 2 (Dengan CP): algoritma wilayah digantikan oleh wilayah_operasi CP
function calcRelevanceScore(tender: any, userProfile: any): number {
  if (!userProfile) return 0;

  const wilayah = (tender.wilayah || "").toLowerCase();
  const instansi = (tender.instansi || "").toLowerCase();
  const namaPaket = (tender.nama_paket || "").toLowerCase();
  const kategori = (tender.kategori || "");
  const tagTender = (tender.tag || "");
  const tenderStr = wilayah + " " + instansi;

  const cp = userProfile.company_profile;

  // ══════════════════════════════════════════════════════
  // MODE 2: DENGAN CP → wilayah_operasi menggantikan profil
  // ══════════════════════════════════════════════════════
  if (cp) {
    const wilayahOps: string[] = (cp.wilayah_operasi || []).map((w: string) => w.toLowerCase());
    const isNasional = wilayahOps.some((w: string) =>
      w.includes("nasional") || w.includes("indonesia") || w.includes("seluruh")
    );

    let skor_wilayah = 0; // Default irrelevant
    
    const explicitMatch = wilayahOps.some((wOp: string) => {
      // Abaikan kata kunci catch-all saat mencari match eksplisit
      if (wOp === "nasional" || wOp === "indonesia" || wOp === "seluruh") return false;
      return tenderStr.includes(wOp) || wOp.split(/[,\s]+/).some((part: string) => part.length > 3 && tenderStr.includes(part));
    });

    if (explicitMatch) {
      skor_wilayah = 65; // Prioritas utama wilayah
    } else if (isNasional) {
      skor_wilayah = 50; 
    } else if (wilayahOps.length === 0) {
      skor_wilayah = 40; // Jika belum diisi, anggap netral
    }

    let match_count = 0;

    // Hitung kecocokan dari Bidang Usaha / KBLI / SBU
    const allBidang = [...(cp.bidang_usaha || []), ...(cp.kode_kbli || []), ...(cp.sub_bidang || [])];
    allBidang.forEach((b: string) => {
      if (b.length > 2 && (kategori.toLowerCase().includes(b.toLowerCase()) || tagTender.toLowerCase().includes(b.toLowerCase()) || namaPaket.includes(b.toLowerCase()))) {
        match_count += 1;
      }
    });

    // Hitung kecocokan dari Kata Kunci Layanan
    if (cp.kata_kunci_layanan?.length > 0) {
      cp.kata_kunci_layanan.forEach((kw: string) => {
        if (kw.length > 2 && (namaPaket.includes(kw.toLowerCase()) || tagTender.toLowerCase().includes(kw.toLowerCase()))) {
          match_count += 1;
        }
      });
    }

    // Semakin banyak keyword yang cocok, semakin bagus skornya
    // Tapi poin wilayah tetap lebih besar dari satu atau dua keyword
    const skor_keyword = Math.min(match_count * 15, 60);

    // Skor Nilai (Pagu)
    let skor_nilai = 0; 
    if (cp.nilai_proyek_max && cp.nilai_proyek_max > 0) {
      const paguNum = Number((tender.pagu || "0").replace(/Rp/gi, "").replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.]/g, ""));
      if (paguNum > 0 && paguNum <= cp.nilai_proyek_max * 1.5) {
        skor_nilai = 0; // Sesuai budget (netral)
      } else if (paguNum > cp.nilai_proyek_max * 1.5) {
        skor_nilai = -15; // Penalti karena over-budget
      }
    }

    let final_score = skor_wilayah + skor_keyword + skor_nilai;
    
    // Pastikan tetap di rentang 0-100
    return Math.max(0, Math.min(100, final_score));
  }

  // ══════════════════════════════════════════════════════
  // MODE 1: TANPA CP → algoritma wilayah dari profil user
  // ══════════════════════════════════════════════════════
  const pUser = (userProfile.provinsi || "").toLowerCase();
  const kUser = (userProfile.kota || "").toLowerCase();

  let skor_wilayah = 30;
  if (kUser && tenderStr.includes(kUser)) {
    skor_wilayah = 100;
  } else if (pUser && tenderStr.includes(pUser)) {
    skor_wilayah = 70;
  } else {
    let tenderProv = "";
    for (const [key, val] of Object.entries(KOTA_PROVINSI_MAP)) {
      if (tenderStr.includes(key.toLowerCase())) { tenderProv = (val as string).toLowerCase(); break; }
    }
    if (!tenderProv) {
      for (const p of Object.keys(ADJACENCY_MAP)) {
        if (tenderStr.includes(p) || (p === "dki jakarta" && tenderStr.includes("jakarta")) || (p === "di yogyakarta" && tenderStr.includes("yogyakarta"))) {
          tenderProv = p; break;
        }
      }
    }
    if (tenderProv === pUser) skor_wilayah = 70;
  }

  return skor_wilayah;
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
    const userDoc = await UserModel.findById(userId).select("provinsi bidang_minat search_history company_profile").lean() as any;
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
      company_profile: userDoc.company_profile || null,
    };

    // ── 1. TENDER BARU / REKOMENDASI (Ladang History) ────────────────────────
    // Mengambil dari 300 tender aktif terbaru tanpa peduli sinceDate,
    // agar inbox Notifikasi selalu terisi dengan tender yang cocok.
    const newTenderDocs = await TenderModel.find({ 
      status: "aktif",
      nama_paket: { $not: /batal|gagal/i },
      tahap_saat_ini: { $not: /batal|gagal/i }
    }).sort({ createdAt: -1 }).limit(300).lean();

    const newTenders = newTenderDocs
      .map((t: any) => ({ ...t, score: calcRelevanceScore(t, userProfile) }))
      .filter((t: any) => t.score >= 50) // Kembalikan ke skor 50 agar kualitas rekomendasi tetap tinggi
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 15) // Tampilkan hingga 15 rekomendasi terbaik
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
        originalTender: { 
          ...t, 
          id: t._id.toString(),
          nama_produk: t.nama_paket, // Map untuk DetailModal
          tipe: t.tipe || "Jasa",
          kategori: t.kategori || t.tag || "",
          relevance_score: t.score, // Map untuk badge "Direkomendasikan"
        },
      }));

    // ── 2. UPDATE JADWAL pada tender yang sudah di-Pin ────────────────────────
    const pinnedIds = pinnedTenders.map((p: any) => p._id);
    const updatedPinnedDocs = await TenderModel.find(
      {
        _id: { $in: pinnedIds },
        updatedAt: { $gt: sinceDate },
      }
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
        originalTender: { 
          ...t, 
          id: t._id.toString(),
          nama_produk: t.nama_paket, // Map untuk DetailModal
          tipe: t.tipe || "Jasa",
          kategori: t.kategori || t.tag || "",
        },
      };
    });

    return NextResponse.json({ newTenders, pinnedUpdates });
  } catch (err) {
    console.error("[notifications] Error:", err);
    return NextResponse.json({ newTenders: [], pinnedUpdates: [] }, { status: 500 });
  }
}
