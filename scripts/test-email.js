/**
 * Test script: kirim 1 email percobaan via Nodemailer
 * Usage: node scripts/test-email.js <email_tujuan>
 */
require("dotenv").config({ path: ".env.local" });
const nodemailer = require("nodemailer");
const { buildDailyDigestHtml } = require("./lpse-scraper/email-template");

const targetEmail = process.argv[2];

if (!targetEmail) {
  console.error("Usage: node scripts/test-email.js <email_tujuan>");
  process.exit(1);
}

async function test() {
  console.log(`📧 Mengirim email test ke: ${targetEmail}`);

  const html = buildDailyDigestHtml(
    { nama_lengkap: "Pengguna Test" },
    [
      {
        tenderName: "Pengadaan Laptop dan Perangkat IT untuk Kantor Dinas Pendidikan",
        instansi: "Dinas Pendidikan Kota Bandung",
        wilayah: "Jawa Barat",
        pagu: "Rp 850.000.000",
        score: 82,
      },
      {
        tenderName: "Jasa Konsultansi Perencana Sistem Informasi Manajemen Pemerintahan",
        instansi: "Sekretariat Daerah Provinsi Jawa Barat",
        wilayah: "Jawa Barat",
        pagu: "Rp 320.000.000",
        score: 67,
      },
      {
        tenderName: "Pengadaan Server dan Infrastruktur Jaringan",
        instansi: "Dinas Kominfo Kota Bandung",
        wilayah: "Jawa Barat",
        pagu: "Rp 1.200.000.000",
        score: 91,
      },
    ]
  );

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Seleno Platform" <${process.env.EMAIL_USER}>`,
    to: targetEmail,
    subject: "3 Rekomendasi Tender Baru untuk Anda Hari Ini",
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email berhasil terkirim! ID:", info.messageId);
    console.log("📬 Silakan cek inbox (atau folder Spam) pada email:", targetEmail);
  } catch (err) {
    console.error("❌ Gagal mengirim email:", err.message);
  }
}

test();
