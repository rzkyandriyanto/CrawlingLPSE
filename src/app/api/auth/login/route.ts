import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { UserModel } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    await connectToDatabase();

    // Cari pengguna berdasarkan email
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    // Verifikasi password (dalam bentuk plain-text sementara, karena data migrasi Supabase mungkin plain)
    if (!user || user.password_hash !== password) {
      return NextResponse.json({ error: "Email atau Password salah!" }, { status: 401 });
    }

    // Kembalikan data pengguna
    const userToReturn = {
      id: user._id.toString(),
      email: user.email,
      perusahaan: user.perusahaan,
      tag: user.bidang_minat, // Supabase format compatibility
      role: user.role,
      avatar_url: user.avatar_url
    };

    return NextResponse.json({ user: userToReturn }, { status: 200 });

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
