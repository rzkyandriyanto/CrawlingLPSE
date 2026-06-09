import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID lelang diperlukan" }, { status: 400 });
    }

    await dbConnect();
    
    // We expect lelangId to match the string id exactly
    const tender = await TenderModel.findOne({ lelangId: id }).lean();
    
    if (!tender) {
      return NextResponse.json({ error: "Tender tidak ditemukan" }, { status: 404 });
    }

    // Mapping to SearchResultItem format if necessary, though raw schema matches mostly
    return NextResponse.json({ tender });
  } catch (err: any) {
    console.error("[Tender Detail API Error]", err);
    return NextResponse.json({ error: "Gagal memuat detail tender" }, { status: 500 });
  }
}
