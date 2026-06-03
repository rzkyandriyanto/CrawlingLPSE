import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { TenderModel } from "@/models/Tender";
import nodemailer from "nodemailer";
import { buildWelcomeEmailHtml } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await UserModel.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cari rekomendasi tender berdasarkan wilayah (kota atau provinsi)
    let recommendedTenders: any[] = [];
    const searchQuery = user.kota || user.provinsi;
    
    if (searchQuery) {
      // Gunakan regex untuk pencarian wilayah
      recommendedTenders = await TenderModel.find({
        wilayah: { $regex: searchQuery, $options: "i" },
        status: "aktif"
      }).sort({ createdAt: -1 }).limit(3).lean();
    }

    // Jika tidak ada di wilayah, ambil tender terbaru secara acak
    if (recommendedTenders.length === 0) {
       recommendedTenders = await TenderModel.find({ status: "aktif" })
         .sort({ createdAt: -1 })
         .limit(3)
         .lean();
    }

    const htmlContent = buildWelcomeEmailHtml(user, recommendedTenders);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    const mailOptions = {
      from: `"Seleno Platform" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Selamat Datang di Seleno! 🎉",
      html: htmlContent,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${user.email}. ID: ${info.messageId}`);

    return NextResponse.json({ success: true, id: info.messageId }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Gagal mengirim email (Nodemailer Error):", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
