import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // Ambil semua tender dengan status "selesai" atau "menang"
    // Urutkan dari yang terbaru di-update/dibuat
    const selesaiTenders = await TenderModel.find({ 
      status: { $in: ["selesai", "menang"] },
      is_deleted: { $ne: true }
    }).sort({ finished_at: -1, updatedAt: -1 });

    // Format menyesuaikan kebutuhan UI (SearchResultItem)
    const mappedTenders = selesaiTenders.map(row => {
      const isProdukModal = (row.nama_paket || "").toLowerCase().includes("belanja");
      return {
      id: row.lelangId,
      tipe: isProdukModal ? "Barang" : "Jasa",
      nama_produk: row.nama_paket || "Paket Pengadaan LPSE",
      deskripsi: "Paket pengadaan pemerintah.",
      ringkasan: "Pengadaan tender LPSE",
      gambar_url: "",
      kategori: row.kategori || "Pekerjaan Konstruksi",
      tag: row.tag || "Konstruksi",
      wilayah: row.wilayah || "Indonesia",
      tanggal: row.tanggal_pembuatan || row.createdAt || "-",
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
      status: row.status || "selesai",
      archived_at: row.archived_at ? row.archived_at.toISOString() : null,
      archived_by: row.archived_by || null,
      };
    });

    return NextResponse.json({ items: mappedTenders });
  } catch (error: any) {
    console.error("Selesai Tenders API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
