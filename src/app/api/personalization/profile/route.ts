import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { TenderModel } from "@/models/Tender";

/**
 * GET /api/personalization/profile?userId=xxx
 * Menghitung "profil minat" user berdasarkan:
 * 1. Tender yang dipin
 * 2. Search history
 * 3. Lokasi provinsi
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId diperlukan" }, { status: 400 });
    }

    await connectToDatabase();

    // Ambil data user
    const user = await UserModel.findById(userId).lean() as any;
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Ambil semua tender yang dipin user
    const pinnedTenders = await TenderModel.find(
      { pinned_by_users: userId },
      { kategori: 1, wilayah: 1, instansi: 1, nama_paket: 1 }
    ).lean();

    // Hitung frekuensi kategori dari pin
    const kategoriCount: Record<string, number> = {};
    const wilayahCount: Record<string, number> = {};

    for (const t of pinnedTenders) {
      const k = (t as any).kategori;
      const w = (t as any).wilayah;
      if (k) kategoriCount[k] = (kategoriCount[k] || 0) + 1;
      if (w) wilayahCount[w] = (wilayahCount[w] || 0) + 1;
    }

    // Sort dan ambil top-3
    const topKategori = Object.entries(kategoriCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);

    const topWilayah = Object.entries(wilayahCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([w]) => w);

    // Top keywords dari search_history
    const topKeywords: string[] = (user.search_history || []).slice(-10).reverse();

    return NextResponse.json({
      provinsi: user.provinsi || "",
      kota: user.kota || "",
      bidang_minat: user.bidang_minat || [],
      topKategori,
      topWilayah,
      topKeywords,
      pinCount: pinnedTenders.length,
    });
  } catch (error: any) {
    console.error("[personalization/profile] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
