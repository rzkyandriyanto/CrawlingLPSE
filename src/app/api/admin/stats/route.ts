import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { TenderModel } from "@/models/Tender";
import { ProductModel } from "@/models/Product";

export async function GET() {
  try {
    await connectToDatabase();

    const userCount = await UserModel.countDocuments();
    const produkCount = await ProductModel.countDocuments(); // Marketplace
    
    // Total LPSE
    const lpseTotal = await TenderModel.countDocuments();
    
    // Breakdown LPSE
    const tipeBreakdown = await TenderModel.aggregate([
      {
        $addFields: {
          isBarang: { $regexMatch: { input: "$nama_paket", regex: /belanja/i } }
        }
      },
      { $group: { _id: { $cond: ["$isBarang", "Barang", "Jasa"] }, count: { $sum: 1 } } }
    ]);
    
    const lpseBarang = tipeBreakdown.find((t: any) => t._id === "Barang")?.count || 0;
    const lpseJasa = tipeBreakdown.find((t: any) => t._id === "Jasa")?.count || 0;

    return NextResponse.json({
      users: userCount,
      jasa: lpseJasa,
      barang: lpseBarang,
      lpseTotal: lpseTotal,
      produk: produkCount
    }, { status: 200 });
  } catch (error: any) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
