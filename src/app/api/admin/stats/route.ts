import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { TenderModel } from "@/models/Tender";
import { ProductModel } from "@/models/Product";

export async function GET() {
  try {
    await connectToDatabase();

    const userCount = await UserModel.countDocuments();
    const jasaCount = await TenderModel.countDocuments();
    const produkCount = await ProductModel.countDocuments();

    return NextResponse.json({
      users: userCount,
      jasa: jasaCount,
      produk: produkCount
    }, { status: 200 });
  } catch (error: any) {
    console.error("Admin Stats Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
