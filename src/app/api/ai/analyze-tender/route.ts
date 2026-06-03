import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";
import { askAI, MODELS } from "@/lib/openrouter";

/**
 * POST /api/ai/analyze-tender
 * Body: { lelangId, nama_paket, instansi, pagu, hps, kategori, wilayah, jadwal, metode_pengadaan }
 *
 * Return: { summary: string, cached: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lelangId, nama_paket, instansi, pagu, hps, kategori, wilayah, jadwal, metode_pengadaan } = body;

    if (!nama_paket) {
      return NextResponse.json({ error: "nama_paket diperlukan" }, { status: 400 });
    }

    await connectToDatabase();

    // ── Cek cache di MongoDB ──────────────────────────────────────────────
    let existing: any = null;
    if (lelangId) {
      existing = await TenderModel.findOne({ lelangId }).lean() as any;
      if (existing?.ai_summary && existing?.ai_summary_at) {
        // Cache valid selama 24 jam
        const ageHours = (Date.now() - new Date(existing.ai_summary_at).getTime()) / 3_600_000;
        if (ageHours < 24) {
          return NextResponse.json({ summary: existing.ai_summary, cached: true });
        }
      }
    }

    // ── Build context dari data tender (Prioritaskan data dari DB jika ada) ──
    const tenderData = existing ? { ...body, ...existing } : body;

    const jadwalStr = Array.isArray(tenderData.jadwal) && tenderData.jadwal.length > 0
      ? tenderData.jadwal.map((j: any) => `• ${j.tahap}: ${j.mulai} s/d ${j.sampai}`).join("\n")
      : "Tidak ada data jadwal.";

    let extraContext = "";
    if (tenderData.status === "selesai" || tenderData.pemenang_nama) {
      extraContext += `\n- Status Tender: SUDAH SELESAI\n- Nama Pemenang: ${tenderData.pemenang_nama || "Belum ada data"}\n- Harga Pemenang: ${tenderData.pemenang_harga || "-"}`;
    } else {
      extraContext += `\n- Tahap Saat Ini: ${tenderData.tahap_saat_ini || "Tidak diketahui"}`;
    }

    if (tenderData.syarat_kualifikasi) {
      // Hilangkan tag HTML dan batasi 1000 karakter agar token tidak jebol
      const strippedSyarat = tenderData.syarat_kualifikasi.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().substring(0, 1000);
      extraContext += `\n- Syarat Kualifikasi (Potongan): ${strippedSyarat}...`;
    }

    const prompt = `Kamu adalah pakar pengadaan barang/jasa pemerintah (LPSE) di Indonesia.

Silakan analisis data tender berikut secara mendalam:

**Data Utama:**
- Nama Paket: ${tenderData.nama_paket}
- Instansi: ${tenderData.instansi || "Tidak diketahui"}
- Kategori / Metode: ${tenderData.kategori || "-"} / ${tenderData.metode_pengadaan || "-"}
- Nilai HPS / Pagu: ${tenderData.hps || "-"} / ${tenderData.pagu || "-"}${extraContext}
- Jadwal Ringkas:
${jadwalStr.substring(0, 800)}

**Instruksi Analisis (SANGAT PENTING):**
1. **Konteks Tahapan**: Sesuaikan analisismu dengan "Tahap Saat Ini" atau "Status Tender".
   - Jika tender "SUDAH SELESAI", fokus evaluasi pemenangnya (apakah harga turun jauh dari HPS, kewajaran harga, dll).
   - Jika masih di tahap awal (Prakualifikasi, Pengumuman, Download Dokumen), fokus pada persiapan dokumen dan syarat kualifikasi.
   - Jika di tahap masa sanggah/evaluasi, bahas risiko gagal/gugur.
2. **Saran Spesifik**: Berikan "saran" yang benar-benar bisa ditindaklanjuti berdasarkan syarat kualifikasi atau jadwal terdekatnya.
3. Kembalikan respons dalam format JSON murni HANYA seperti struktur berikut (Dilarang menambahkan teks pengantar atau markdown block):

{
  "gambaran": "2-3 kalimat penjelasan ringkas tentang inti tender ini",
  "poin_penting": ["poin 1 (minimal 10 kata)", "poin 2", "poin 3"],
  "kompetisi": "Rendah | Sedang | Tinggi",
  "alasan_kompetisi": "1 kalimat penjelasan tingkat kompetisi",
  "saran": "Saran praktis spesifik untuk calon peserta/pengamat"
}`;

    // ── Panggil OpenRouter ────────────────────────────────────────────────
    const aiText = await askAI({
      model: MODELS.GEMINI_FLASH,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 600,
      temperature: 0.4,
    });

    // ── Parse JSON dari AI ────────────────────────────────────────────────
    let parsed: any = null;
    try {
      const cleanJson = aiText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // Kalau parse gagal, return raw text
    }

    const summary = parsed ? JSON.stringify(parsed) : aiText;

    // ── Simpan ke cache di MongoDB ────────────────────────────────────────
    if (lelangId) {
      await TenderModel.findOneAndUpdate(
        { lelangId },
        { $set: { ai_summary: summary, ai_summary_at: new Date() } },
        { upsert: false }
      );
    }

    return NextResponse.json({ summary, cached: false });
  } catch (error: any) {
    console.error("[analyze-tender] Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menganalisis tender" }, { status: 500 });
  }
}
