import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";
import { ProductModel } from "@/models/Product";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');

    await connectToDatabase();

    let data = [];
    if (table === "paket_lelang") {
      const tenders = await TenderModel.find().sort({ createdAt: -1 }).limit(100);
      data = tenders.map(t => ({
        id: t._id.toString(),
        nama_paket: t.nama_paket,
        instansi: t.instansi,
        kategori: t.kategori,
        metode_pengadaan: t.metode_pengadaan,
        pagu: t.pagu,
        hps: t.hps,
        created_at: t.createdAt
      }));
    } else if (table === "produk") {
      const products = await ProductModel.find().sort({ createdAt: -1 }).limit(100);
      data = products.map(p => ({
        id: p._id.toString(),
        nama_produk: p.nama_produk,
        nama_perusahaan: p.nama_perusahaan,
        kategori: p.kategori,
        harga: p.harga,
        created_at: p.createdAt
      }));
    } else {
      return NextResponse.json({ error: "Tabel tidak valid" }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Data Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');

    if (!table || !id) {
      return NextResponse.json({ error: "Tabel dan ID diperlukan" }, { status: 400 });
    }

    await connectToDatabase();

    if (table === "paket_lelang") {
      await TenderModel.findByIdAndDelete(id);
    } else if (table === "produk") {
      await ProductModel.findByIdAndDelete(id);
    } else {
      return NextResponse.json({ error: "Tabel tidak valid" }, { status: 400 });
    }

    return NextResponse.json({ message: "Data berhasil dihapus" }, { status: 200 });
  } catch (error: any) {
    console.error("Delete Data Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
