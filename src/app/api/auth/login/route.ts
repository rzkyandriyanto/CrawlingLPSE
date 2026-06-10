import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import nodemailer from "nodemailer";

async function sendSecurityAlertEmail(email: string, ip: string, userAgent: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email configuration missing, skipping security alert.");
    return;
  }
  
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Seleno Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "⚠️ Peringatan Keamanan: Login Baru Terdeteksi",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #d9534f;">Peringatan Keamanan</h2>
          <p>Halo,</p>
          <p>Sistem kami mendeteksi login baru pada akun Seleno Anda.</p>
          <ul style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
            <li><strong>Waktu:</strong> ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</li>
            <li><strong>IP Address:</strong> ${ip}</li>
            <li><strong>Perangkat/Browser:</strong> ${userAgent}</li>
          </ul>
          <p>Jika ini <strong>BUKAN</strong> Anda, ada kemungkinan password Anda telah diketahui oleh pihak lain. Harap segera amankan akun Anda atau hubungi administrator.</p>
          <p>Salam,<br/>Tim Keamanan Seleno</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Gagal mengirim email notifikasi login:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }

    await connectToDatabase();

    // Cari pengguna berdasarkan email
    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: "Email atau Password salah!" }, { status: 401 });
    }

    // Rate limiting (Lapis 1): Cek apakah akun terkunci
    if (user.lock_until && user.lock_until.getTime() > Date.now()) {
      const lockTimeRemaining = Math.ceil((user.lock_until.getTime() - Date.now()) / 60000);
      return NextResponse.json({ 
        error: `Akun terkunci karena terlalu banyak percobaan. Coba lagi dalam ${lockTimeRemaining} menit.` 
      }, { status: 429 });
    }

    // Verifikasi password
    if (user.password_hash !== password) {
      // Tambah jumlah percobaan gagal
      user.login_attempts = (user.login_attempts || 0) + 1;
      
      // Jika sudah 5 kali gagal, kunci selama 15 menit
      if (user.login_attempts >= 5) {
        user.lock_until = new Date(Date.now() + 15 * 60 * 1000); // 15 menit dari sekarang
      }
      
      await user.save();
      return NextResponse.json({ error: "Email atau Password salah!" }, { status: 401 });
    }

    // Jika login berhasil, reset percobaan gagal dan kuncian
    if (user.login_attempts > 0 || user.lock_until) {
      user.login_attempts = 0;
      user.lock_until = null;
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();
    user.session_token = sessionToken;
    await user.save();

    // Security Alert (Lapis 3): Kirim notifikasi email HANYA jika IP berbeda (atau ini login pertama)
    const ip = req.headers.get("x-forwarded-for") || "IP Tidak Diketahui";
    const userAgent = req.headers.get("user-agent") || "Perangkat Tidak Diketahui";
    
    let isNewDeviceOrIP = false;
    // Jika user.last_ip belum ada (login pertama kali) atau berbeda dengan IP sekarang
    if (!user.last_ip || user.last_ip !== ip) {
      isNewDeviceOrIP = true;
      // Eksekusi secara asinkron tanpa harus di-await agar respon login tidak lambat
      sendSecurityAlertEmail(user.email, ip, userAgent);
    }

    // Update IP dan User Agent terakhir
    user.last_ip = ip;
    user.last_user_agent = userAgent;
    await user.save();

    // Kembalikan data pengguna
    const userToReturn = {
      id: user._id.toString(),
      email: user.email,
      perusahaan: user.perusahaan,
      tag: user.bidang_minat,
      role: user.role,
      avatar_url: user.avatar_url,
      kota: user.kota,
      provinsi: user.provinsi,
      session_token: sessionToken
    };

    return NextResponse.json({ user: userToReturn }, { status: 200 });

  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
