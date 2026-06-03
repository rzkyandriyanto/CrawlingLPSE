import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";

/**
 * Utility: parse tanggal format "DD MonthName YYYY HH:MM" ke Date
 */
function parseIndonesianDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "-") return null;

  const monthMap: Record<string, string> = {
    Januari: "01", Februari: "02", Maret: "03", April: "04",
    Mei: "05", Juni: "06", Juli: "07", Agustus: "08",
    September: "09", Oktober: "10", November: "11", Desember: "12",
  };

  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+(\d{2}:\d{2}))?/);
  if (match) {
    const [, day, monthName, year, time] = match;
    const month = monthMap[monthName] || "01";
    const timeStr = time || "23:59";
    const parsed = new Date(`${year}-${month}-${day.padStart(2, "0")}T${timeStr}:00`);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  // Fallback ISO
  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Cek apakah tender expired berdasarkan:
 * 1. Data jadwal (jika ada) - tanggal akhir + grace period
 * 2. Kata kunci status di metode_pengadaan (Selesai, Batal, Gagal)
 * 3. Usia data di DB (fallback: lebih dari maxAgeDays hari)
 */
function getTenderExpiredReason(
  tender: any,
  graceDays = 7,
  maxAgeDays = 90
): string | null {
  // Strategi 1: cek dari jadwal jika ada
  if (tender.jadwal && tender.jadwal.length > 0) {
    let latestEnd: Date | null = null;
    for (const step of tender.jadwal) {
      const d = parseIndonesianDate(step.sampai || "");
      if (d && (!latestEnd || d > latestEnd)) latestEnd = d;
    }
    if (latestEnd) {
      const graceMs = graceDays * 24 * 60 * 60 * 1000;
      if (latestEnd.getTime() + graceMs < Date.now()) {
        return `Semua tahap jadwal sudah selesai sejak ${latestEnd.toLocaleDateString("id-ID")} (+${graceDays} hari grace)`;
      }
    }
  }

  // Strategi 2: cek status dari field metode_pengadaan atau finished_at
  if (tender.finished_at) {
    return `Tender ditandai selesai pada ${new Date(tender.finished_at).toLocaleDateString("id-ID")}`;
  }

  const statusText = (tender.metode_pengadaan || "").toLowerCase();
  if (/selesai|batal|gagal|cancel|closed/.test(statusText)) {
    return `Status tender: "${tender.metode_pengadaan}"`;
  }

  // Strategi 3: usia data melebihi maxAgeDays (tender lama tanpa jadwal)
  if (tender.createdAt) {
    const ageMs = Date.now() - new Date(tender.createdAt).getTime();
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    if (ageDays > maxAgeDays) {
      return `Data sudah ${Math.floor(ageDays)} hari di database (melebihi ${maxAgeDays} hari)`;
    }
  }

  return null; // masih aktif
}

/**
 * GET /api/tenders/cleanup
 * Preview: tampilkan daftar tender yang akan dihapus (dry run)
 *
 * POST /api/tenders/cleanup
 * Eksekusi: hapus tender yang sudah selesai dari DB
 * Body: { graceDays?: number, dryRun?: boolean }
 */

// GET → preview/dry-run
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const allTenders = await TenderModel.find({}).lean() as any[];

    const expired: any[] = [];
    const active: any[] = [];

    for (const tender of allTenders) {
      const expiredReason = getTenderExpiredReason(tender, 7, 90);
      if (expiredReason) {
        expired.push({
          id: tender._id.toString(),
          lelangId: tender.lelangId,
          nama_paket: tender.nama_paket,
          instansi: tender.instansi,
          pinned_count: tender.pinned_by_users?.length || 0,
          alasan: expiredReason,
          created_at: tender.createdAt,
        });
      } else {
        active.push(tender.lelangId);
      }
    }

    return NextResponse.json({
      total: allTenders.length,
      expired_count: expired.length,
      active_count: active.length,
      expired_tenders: expired,
      message: `${expired.length} tender akan dihapus (sudah selesai >7 hari). Kirim POST untuk eksekusi.`,
    });
  } catch (error: any) {
    console.error("[cleanup] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST → eksekusi hapus
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const graceDays: number = body.graceDays ?? 7;
    const maxAgeDays: number = body.maxAgeDays ?? 90;
    const dryRun: boolean = body.dryRun ?? false;

    await connectToDatabase();

    const allTenders = await TenderModel.find({}).lean() as any[];

    const toDelete: string[] = [];
    const pinnedSkipped: any[] = [];

    for (const tender of allTenders) {
      const expiredReason = getTenderExpiredReason(tender, graceDays, maxAgeDays);
      if (!expiredReason) continue;

      // Jangan hapus tender yang masih di-pin user manapun
      if (tender.pinned_by_users && tender.pinned_by_users.length > 0) {
        pinnedSkipped.push({
          lelangId: tender.lelangId,
          nama_paket: tender.nama_paket,
          pinned_by: tender.pinned_by_users.length,
        });
        continue;
      }

      toDelete.push(tender._id.toString());
      // (alasan: expiredReason sudah tercatat di atas)
    }

    if (dryRun) {
      return NextResponse.json({
        dry_run: true,
        would_delete: toDelete.length,
        skipped_pinned: pinnedSkipped.length,
        pinned_details: pinnedSkipped,
        message: "Dry run selesai. Kirim POST dengan { dryRun: false } untuk eksekusi.",
      });
    }

    // Eksekusi hapus
    const result = await TenderModel.deleteMany({
      _id: { $in: toDelete },
    });

    return NextResponse.json({
      success: true,
      deleted: result.deletedCount,
      skipped_pinned: pinnedSkipped.length,
      pinned_details: pinnedSkipped,
      grace_days: graceDays,
      timestamp: new Date().toISOString(),
      message: `${result.deletedCount} tender berhasil dihapus. ${pinnedSkipped.length} tender yang masih di-pin dilewati.`,
    });
  } catch (error: any) {
    console.error("[cleanup] POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
