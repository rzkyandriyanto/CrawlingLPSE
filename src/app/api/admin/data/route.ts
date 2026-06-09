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
      // Hanya ambil Tender yang TIDAK memiliki kata "belanja" (Jasa murni)
      const tenders = await TenderModel.find({ nama_paket: { $not: /belanja/i } }).sort({ createdAt: -1 }).limit(2500);
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
      // Ambil produk dari Marketplace
      const products = await ProductModel.find().sort({ createdAt: -1 }).limit(2500);
      // Ambil Barang dari LPSE (Tender yang memiliki kata "belanja")
      const lpseBarang = await TenderModel.find({ nama_paket: /belanja/i }).sort({ createdAt: -1 }).limit(2500);
      
      const mappedProducts = products.map(p => ({
        id: p._id.toString(),
        nama_produk: p.nama_produk,
        nama_perusahaan: p.nama_perusahaan,
        kategori: p.kategori,
        harga: p.harga,
        created_at: p.createdAt
      }));

      const mappedLpseBarang = lpseBarang.map(t => ({
        id: t._id.toString(),
        nama_produk: t.nama_paket,
        nama_perusahaan: t.instansi, // LPSE tidak punya nama_perusahaan, gunakan instansi
        kategori: t.kategori,
        harga: t.pagu,
        created_at: t.createdAt
      }));

      data = [...mappedLpseBarang, ...mappedProducts].sort((a, b) => {
        // Urutkan gabungan berdasarkan createdAt terbaru
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }).slice(0, 2500); // Batasi total maksimal 2500
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
