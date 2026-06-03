import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import connectToDatabase from "@/lib/mongoose";
import { UserModel } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Validasi Tipe File
    const allowedExtensions = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedExtensions.includes(file.type)) {
      return NextResponse.json({ error: "Format berkas tidak valid" }, { status: 400 });
    }

    // 2. Tentukan Direktori Penyimpanan
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await fs.mkdir(uploadDir, { recursive: true });

    // 3. Buat Nama File Unik
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${userId}-${Date.now()}.${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // 4. Konversi File ke Buffer dan Tulis ke Disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    // 5. Perbarui avatar_url User
    await connectToDatabase();
    
    const publicAvatarUrl = `/uploads/avatars/${uniqueFileName}`;
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { avatar_url: publicAvatarUrl } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Foto profil berhasil diperbarui", 
      avatar_url: publicAvatarUrl 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Gagal mengunggah foto:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
