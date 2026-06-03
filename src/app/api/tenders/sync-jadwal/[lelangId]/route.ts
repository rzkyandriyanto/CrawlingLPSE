import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";

/**
 * GET /api/tenders/sync-jadwal/[lelangId]?url_lpse=https://lpse.xxx.go.id/eproc4
 *
 * Fetches the latest jadwal for a tender from the LPSE public JSON API,
 * updates the MongoDB record, and returns the fresh data.
 */
export async function GET(
  req: NextRequest,
  context: any
) {
  const params = await context.params;
  const { lelangId } = params;
  const { searchParams } = new URL(req.url);
  const urlLpse = searchParams.get("url_lpse");

  if (!lelangId) {
    return NextResponse.json({ error: "lelangId diperlukan" }, { status: 400 });
  }

  if (!urlLpse) {
    return NextResponse.json({ error: "url_lpse diperlukan" }, { status: 400 });
  }

  // Normalize base URL (hapus trailing slash)
  const baseUrl = urlLpse.replace(/\/+$/, "");

  // LPSE public JSON API endpoint for jadwal
  const lpseApiUrl = `${baseUrl}/api/publik/paketlelang/${lelangId}/jadwal`;

  try {
    // ── Fetch jadwal dari LPSE ──────────────────────────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let jadwalFromLpse: any[] = [];

    try {
      const lpseRes = await fetch(lpseApiUrl, {
        signal: controller.signal,
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; TenderSync/1.0)",
        },
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (lpseRes.ok) {
        const raw = await lpseRes.json();

        // LPSE API bisa return array langsung atau { data: [...] } atau { jadwal: [...] }
        const rows: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.jadwal)
          ? raw.jadwal
          : [];

        jadwalFromLpse = rows.map((r: any) => ({
          tahap:
            r.tahap ||
            r.namaTahap ||
            r.nama_tahap ||
            r.stage ||
            "Tahap",
          mulai:
            r.mulai ||
            r.tanggalMulai ||
            r.tanggal_mulai ||
            r.startDate ||
            "",
          sampai:
            r.sampai ||
            r.tanggalSelesai ||
            r.tanggal_selesai ||
            r.endDate ||
            "",
          perubahan:
            r.perubahan ||
            r.keterangan ||
            r.description ||
            "Tidak Ada",
        }));
      }
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      // Jika fetch LPSE gagal (timeout/network), lanjut ambil dari DB
      console.warn(`[sync-jadwal] Gagal fetch dari LPSE (${lpseApiUrl}):`, fetchErr.message);
    }

    // ── Koneksi ke MongoDB ──────────────────────────────────────────────
    await connectToDatabase();

    if (jadwalFromLpse.length > 0) {
      // ── Cek apakah tender sudah selesai ────────────────────────────────
      const now = Date.now();
      const monthMap: Record<string, string> = {
        Januari: "01", Februari: "02", Maret: "03", April: "04",
        Mei: "05", Juni: "06", Juli: "07", Agustus: "08",
        September: "09", Oktober: "10", November: "11", Desember: "12",
      };

      const parseDate = (s: string): Date | null => {
        const m = s?.trim().match(/^(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+(\d{2}:\d{2}))?/);
        if (m) {
          const [, d, mo, y, t] = m;
          const parsed = new Date(`${y}-${monthMap[mo] || "01"}-${d.padStart(2, "0")}T${t || "23:59"}:00+07:00`);
          return isNaN(parsed.getTime()) ? null : parsed;
        }
        const fb = new Date(s);
        return isNaN(fb.getTime()) ? null : fb;
      };

      // Cari tanggal akhir dari semua tahap jadwal
      let latestEnd: Date | null = null;
      for (const step of jadwalFromLpse) {
        const d = parseDate(step.sampai || "");
        if (d && (!latestEnd || d > latestEnd)) latestEnd = d;
      }

      // Grace period 7 hari setelah tahap terakhir selesai
      const GRACE_MS = 7 * 24 * 60 * 60 * 1000;
      const isExpired = latestEnd && (latestEnd.getTime() + GRACE_MS) < now;

      if (isExpired) {
        // Cek apakah ada user yang pin tender ini sebelum hapus
        const existing = await TenderModel.findOne({ lelangId }).lean() as any;
        const isPinned = existing?.pinned_by_users?.length > 0;

        if (!isPinned) {
          await TenderModel.deleteOne({ lelangId });
          return NextResponse.json({
            source: "lpse",
            deleted: true,
            reason: "Tender sudah selesai dan melebihi grace period 7 hari",
            last_stage_end: latestEnd?.toISOString(),
          });
        }
      }

      // Update jadwal di MongoDB jika tender masih aktif
      await TenderModel.findOneAndUpdate(
        { lelangId },
        { $set: { jadwal: jadwalFromLpse, updatedAt: new Date() } },
        { upsert: false }
      );

      return NextResponse.json({
        source: "lpse",
        jadwal: jadwalFromLpse,
        synced_at: new Date().toISOString(),
        is_expired: isExpired,
      });

    } else {
      // Fallback: ambil dari MongoDB jika LPSE tidak memberikan data
      const tender = await TenderModel.findOne({ lelangId }).lean();

      return NextResponse.json({
        source: "database",
        jadwal: (tender as any)?.jadwal || [],
        synced_at: null,
      });
    }
  } catch (error: any) {
    console.error("[sync-jadwal] Error:", error);
    return NextResponse.json(
      { error: "Gagal sinkronisasi jadwal", detail: error.message },
      { status: 500 }
    );
  }
}
