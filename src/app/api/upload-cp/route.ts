import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import connectToDatabase from "@/lib/mongoose";
import { UserModel } from "@/models/User";
const pdfParse = require("pdf-parse");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = (formData.get("cp_pdf") || formData.get("cp_file")) as File;
    const userId = formData.get("userId") as string;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!file || !userId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Hanya format PDF yang diperbolehkan" }, { status: 400 });
    }

    // Validasi Ukuran (Maksimal 100MB = 100 * 1024 * 1024 bytes)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file PDF terlalu besar. Maksimal 100 MB." }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "Sistem belum dikonfigurasi untuk AI" }, { status: 500 });
    }

    // 1. Ekstrak Teks Langsung dari Memori (Tanpa menyimpan ke disk server)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let pdfText = "";
    try {
      const parsed = await pdfParse(buffer);
      pdfText = parsed.text;
    } catch (err) {
      console.error("Gagal parse PDF:", err);
      return NextResponse.json({ error: "Gagal membaca teks dari PDF. Pastikan PDF tidak diproteksi." }, { status: 400 });
    }

    if (!pdfText || pdfText.trim() === "") {
      return NextResponse.json({ error: "PDF kosong atau berbentuk gambar yang tidak bisa dibaca teksnya." }, { status: 400 });
    }

    // Batasi teks agar tidak melebihi limit prompt (approx 30,000 chars is safe for Flash)
    const truncatedText = pdfText.substring(0, 30000);

    // 2. Kirim Teks ke Gemini AI
    const prompt = `Kamu adalah AI ekstraksi data Company Profile perusahaan Indonesia untuk keperluan pencocokan tender LPSE.

Dari teks Company Profile berikut, ekstrak informasi dan kembalikan HANYA dalam format JSON:

{
  "nama_perusahaan": "",
  "bidang_usaha": [],
  "sub_bidang": [],
  "kode_kbli": [],
  "kode_sbu": [],
  "kualifikasi": "",
  "domisili": { "kota": "", "provinsi": "" },
  "wilayah_operasi": [],
  "pengalaman_proyek": [
    { "nama_proyek": "", "pemberi_kerja": "", "nilai_kontrak": 0, "tahun": "" }
  ],
  "nilai_proyek_max": 0,
  "sertifikasi": [],
  "kata_kunci_layanan": [],
  "tenaga_ahli": [],
  "tahun_berdiri": ""
}

Aturan:
- Untuk nilai_proyek_max, ambil nilai kontrak tertinggi dari daftar pengalaman
- kata_kunci_layanan: ekstrak kata kunci spesifik layanan/produk (maks 20 keyword)
- Jika data tidak ada, isi dengan null atau array kosong
- JANGAN TULIS TEKS APAPUN SELAIN JSON, JANGAN GUNAKAN MARKDOWN \`\`\`json

Teks Company Profile:
${truncatedText}`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });

    if (!geminiRes.ok) {
      const errTxt = await geminiRes.text();
      console.error("Gemini API Error:", errTxt);
      return NextResponse.json({ error: "Gagal memproses dokumen dengan AI." }, { status: 500 });
    }

    const data = await geminiRes.json();
    let textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResult) {
      return NextResponse.json({ error: "AI tidak mengembalikan data yang valid." }, { status: 500 });
    }

    let parsedJson = {};
    try {
      // Bersihkan jika AI masih ngirim markdown
      textResult = textResult.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
      parsedJson = JSON.parse(textResult);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", textResult);
      return NextResponse.json({ error: "Gagal mengolah format data AI." }, { status: 500 });
    }

    // 3. Perbarui company_profile User di Database
    await connectToDatabase();
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { company_profile: parsedJson } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Company Profile berhasil diekstrak dan disimpan", 
      company_profile: parsedJson 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Gagal memproses CP:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
