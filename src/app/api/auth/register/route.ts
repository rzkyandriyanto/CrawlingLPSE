import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { UserModel } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { perusahaan, email, alamat, kota, provinsi, password } = await req.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Data tidak lengkap atau password kurang dari 6 karakter" }, { status: 400 });
    }

    await connectToDatabase();

    // Cek apakah email sudah terdaftar
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar! Silakan gunakan email lain atau login." }, { status: 400 });
    }

    // Buat username unik
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "user";
    const username = `${baseUsername}_${Date.now()}`;

    // Buat pengguna baru
    const newUser = new UserModel({
      username,
      email: email.toLowerCase(),
      password_hash: password, // Di production sebaiknya di-hash menggunakan bcrypt
      perusahaan: perusahaan || "",
      nama_lengkap: perusahaan || "", // fallback nama
      alamat: alamat || (kota && provinsi ? `${kota}, ${provinsi}` : ""),
      kota: kota || "",
      provinsi: provinsi || "",
      role: "user"
    });

    await newUser.save();

    // Kembalikan data pengguna (tanpa password)
    const userToReturn = {
      id: newUser._id.toString(),
      email: newUser.email,
      perusahaan: newUser.perusahaan,
      tag: newUser.bidang_minat,
      role: newUser.role,
      avatar_url: newUser.avatar_url,
      kota: newUser.kota,
      provinsi: newUser.provinsi
    };

    return NextResponse.json({ user: userToReturn }, { status: 201 });

  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
