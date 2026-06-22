import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";

export async function GET(req: NextRequest) {
  try {
    // Menghubungkan ke database MongoDB
    await connectToDatabase();

    // Mengambil parameter query dari URL request
    const searchParams = req.nextUrl.searchParams;
    
    // Mendapatkan nilai page (halaman), default 1 jika tidak disediakan
    const page = parseInt(searchParams.get("page") || "1", 10);
    
    // Mendapatkan nilai limit (batas data per halaman), default 20
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    
    // Menghitung jumlah data yang akan dilewati (skip) berdasarkan halaman saat ini
    const skip = (page - 1) * limit;

    // Filter tender, mengambil data yang belum dihapus
    const query = { is_deleted: { $ne: true } };

    // Menghitung total data keseluruhan untuk mengembalikan totalCount kepada frontend
    const totalCount = await TenderModel.countDocuments(query);

    // Mengambil data dari database menggunakan .skip() dan .limit() untuk pagination
    const tenders = await TenderModel.find(query)
      .sort({ createdAt: -1 }) // Mengurutkan dari data terbaru
      .skip(skip)
      .limit(limit)
      .lean();

    // Mengembalikan response berisi data, totalCount untuk keperluan pagination di frontend
    return NextResponse.json({
      data: tenders,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error: any) {
    console.error("Error fetching tenders:", error);
    // Mengembalikan error dengan status HTTP 500
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
