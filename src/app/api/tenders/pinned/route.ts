import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await connectToDatabase();

    const pinnedTenders = await TenderModel.find({ pinned_by_users: userId })
      .sort({ createdAt: -1 });

    // Map them to the format DashboardContext expects
    const mappedTenders = pinnedTenders.map(row => ({
      id: row.lelangId,
      tipe: "Jasa",
      nama_produk: row.nama_paket || "Paket Pengadaan LPSE",
      deskripsi: "Paket pengadaan pemerintah.",
      ringkasan: "Pengadaan tender LPSE",
      gambar_url: "",
      kategori: row.kategori || "Pekerjaan Konstruksi",
      tag: row.tag || "Konstruksi",
      wilayah: row.wilayah || "Indonesia",
      tanggal: row.createdAt || "-",
      instansi: row.instansi,
      pagu: row.pagu || "Rp 0",
      hps: row.hps || "Rp 0",
      metode_pengadaan: row.metode_pengadaan || "Tender",
      nama_perusahaan: row.instansi,
      url_lpse: row.url_lpse,
      lelangId: row.lelangId,
      jadwal: row.jadwal,
      created_at: row.createdAt,
      // Status lifecycle
      status: row.status || "aktif",
      archived_at: row.archived_at ? row.archived_at.toISOString() : null,
      archived_by: row.archived_by || null,
    }));

    return NextResponse.json({ items: mappedTenders });
  } catch (error: any) {
    console.error("Pinned Tenders API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
