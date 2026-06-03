import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";

/**
 * PATCH /api/tenders/status
 * Body: { tenderId: string, userId: string, status: "gagal" | "menang" | "selesai" | "aktif" }
 *
 * Mengupdate status lifecycle tender.
 * - Saat status berubah ke gagal/menang/selesai → archived_at di-set ke sekarang
 * - Saat status kembali ke aktif → archived_at di-reset ke null
 * - Hanya user yang me-pin tender tersebut yang bisa mengubah status
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenderId, userId, status } = body;

    if (!tenderId || !userId || !status) {
      return NextResponse.json(
        { error: "Field tenderId, userId, dan status wajib diisi." },
        { status: 400 }
      );
    }

    const validStatuses = ["aktif", "gagal", "selesai", "menang"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status tidak valid. Gunakan salah satu: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Cari tender dan pastikan user sudah me-pin tender ini
    const tender = await TenderModel.findOne({ lelangId: tenderId });

    if (!tender) {
      return NextResponse.json({ error: "Tender tidak ditemukan." }, { status: 404 });
    }

    const isPinned = tender.pinned_by_users?.includes(userId);
    if (!isPinned) {
      return NextResponse.json(
        { error: "Anda hanya bisa mengubah status tender yang sudah Anda simpan." },
        { status: 403 }
      );
    }

    // Set archived_at jika berubah dari aktif ke arsip
    const isArchiving = status !== "aktif";
    const wasActive = tender.status === "aktif";

    const updatePayload: Record<string, any> = {
      status,
      archived_by: isArchiving ? userId : null,
    };

    if (isArchiving && wasActive) {
      // Baru diarsipkan → set timestamp sekarang
      updatePayload.archived_at = new Date();
    } else if (!isArchiving) {
      // Dikembalikan ke aktif → reset arsip
      updatePayload.archived_at = null;
      updatePayload.archived_by = null;
    }
    // Jika sudah di arsip lalu diubah status arsip (gagal→menang), pertahankan archived_at asal

    await TenderModel.updateOne({ lelangId: tenderId }, { $set: updatePayload });

    return NextResponse.json({
      success: true,
      tenderId,
      status,
      archived_at: updatePayload.archived_at?.toISOString() ?? tender.archived_at?.toISOString() ?? null,
      message: `Status tender berhasil diubah menjadi "${status}".`,
    });
  } catch (error: any) {
    console.error("[status] PATCH error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
