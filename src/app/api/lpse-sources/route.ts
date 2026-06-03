import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    await connectToDatabase();
    
    // Ambil instansi yang unik di mana url_lpse tidak kosong
    const sources = await TenderModel.distinct("instansi", {
      url_lpse: { $nin: [null, "", " "] }
    });

    // Filter out falsy values and sort
    const validSources = sources
      .filter(Boolean)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .sort();

    // Hapus duplikat setelah trim
    const uniqueSources = Array.from(new Set(validSources));

    return NextResponse.json({ sources: uniqueSources }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch LPSE sources:", error);
    return NextResponse.json({ error: "Gagal mengambil daftar LPSE" }, { status: 500 });
  }
}
