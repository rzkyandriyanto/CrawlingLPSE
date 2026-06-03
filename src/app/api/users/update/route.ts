import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { UserModel } from "@/models/User";

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, tag, perusahaan, email, kota, provinsi } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID diperlukan" }, { status: 400 });
    }

    await connectToDatabase();

    // Siapkan data update
    const updateData: any = {};
    if (tag !== undefined) updateData.bidang_minat = tag;
    if (perusahaan !== undefined) updateData.perusahaan = perusahaan;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (kota !== undefined) updateData.kota = kota;
    if (provinsi !== undefined) updateData.provinsi = provinsi;

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ 
      user: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        perusahaan: updatedUser.perusahaan,
        tag: updatedUser.bidang_minat,
        role: updatedUser.role,
        avatar_url: updatedUser.avatar_url
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Update User Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
