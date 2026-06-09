import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";

const AUTO_DELETE_DAYS = 3;

/**
 * GET /api/tenders/auto-cleanup
 *
 * Dipanggil secara otomatis dari client (fire-and-forget) saat dashboard dibuka.
 * Menghapus tender yang:
 * 1. Sudah di-arsip (archived_at !== null)
 * 2. archived_at sudah lebih dari AUTO_DELETE_DAYS hari yang lalu
 * 3. Tidak di-pin oleh siapapun (pinned_by_users kosong)
 *
 * Jika tender masih di-pin user lain, tender TIDAK dihapus tapi archived_at diperpanjang.
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const cutoffDate = new Date(Date.now() - AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000);

    // Cari semua tender yang sudah melewati batas waktu arsip
    const expiredArchived = await TenderModel.find({
      archived_at: { $ne: null, $lte: cutoffDate },
    }).lean() as any[];

    if (expiredArchived.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: "Tidak ada tender yang perlu dihapus.",
      });
    }

    const toDelete: string[] = [];
    const stillPinned: string[] = [];

    for (const tender of expiredArchived) {
      if (tender.pinned_by_users && tender.pinned_by_users.length > 0) {
        // Masih di-pin seseorang → skip hapus, tapi tidak perpanjang arsip
        stillPinned.push(tender.lelangId);
      } else {
        toDelete.push(tender._id.toString());
      }
    }

    let deletedCount = 0;
    if (toDelete.length > 0) {
      const result = await TenderModel.updateMany(
        { _id: { $in: toDelete } },
        { $set: { is_deleted: true } }
      );
      deletedCount = result.modifiedCount;
    }

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      skipped_still_pinned: stillPinned.length,
      cutoff_date: cutoffDate.toISOString(),
      message: `${deletedCount} tender dihapus otomatis (arsip > ${AUTO_DELETE_DAYS} hari). ${stillPinned.length} dilewati karena masih di-pin.`,
    });
  } catch (error: any) {
    console.error("[auto-cleanup] GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
