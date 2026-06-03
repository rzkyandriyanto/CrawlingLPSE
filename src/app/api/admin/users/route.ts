import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { UserModel } from "@/models/User";

export async function GET() {
  try {
    await connectToDatabase();
    const users = await UserModel.find().sort({ createdAt: -1 });
    
    // Map data ke format yang diharapkan frontend
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      perusahaan: user.perusahaan,
      tag: user.bidang_minat,
      role: user.role,
      created_at: user.createdAt
    }));

    return NextResponse.json({ users: formattedUsers }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID pengguna diperlukan" }, { status: 400 });
    }

    await connectToDatabase();
    await UserModel.findByIdAndDelete(id);

    return NextResponse.json({ message: "Pengguna berhasil dihapus" }, { status: 200 });
  } catch (error: any) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, perusahaan } = await req.json();

    if (!email || !password || !perusahaan) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "admin";
    const username = `${baseUsername}_${Date.now()}`;

    const newAdmin = new UserModel({
      username,
      email: email.toLowerCase(),
      password_hash: password,
      perusahaan,
      nama_lengkap: perusahaan,
      role: "admin"
    });

    await newAdmin.save();

    return NextResponse.json({ message: "Admin berhasil ditambahkan" }, { status: 201 });
  } catch (error: any) {
    console.error("Add Admin Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
