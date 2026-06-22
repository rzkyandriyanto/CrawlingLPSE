import { NextRequest, NextResponse } from "next/server";
import { askAI, MODELS } from "@/lib/openrouter";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";

/**
 * POST /api/ai/analyze-bidding
 * Body: {
 *   nama_paket: string,
 *   pagu: string,
 *   hps: string,
 *   pemenang_nama: string,
 *   pemenang_harga: string,
 *   peserta: [{ nama: string, harga: number, isWinner: boolean }]
 * }
 * Return: { analysis: { ringkasan, analisis_selisih, strategi_pemenang, pelajaran, level_kompetisi, alasan_level, asumsi_metode } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lelangId, nama_paket, pagu, hps, pemenang_nama, pemenang_harga, peserta } = body;

    if (!nama_paket || !peserta || peserta.length === 0) {
      return NextResponse.json({ error: "Data peserta diperlukan" }, { status: 400 });
    }

    // ── Cek Cache di Database ──
    if (lelangId) {
      await connectToDatabase();
      const tender = await TenderModel.findOne({ lelangId });
      
      // Jika cache valid (ada analisis dan panjang string > 100 karakter)
      if (tender && tender.analysis_bidding && JSON.stringify(tender.analysis_bidding).length > 100) {
        console.log(`[analyze-bidding] Mengembalikan cache untuk lelangId: ${lelangId}`);
        return NextResponse.json({ analysis: tender.analysis_bidding });
      }
    }

    const fmt = (num: number) =>
      new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
    const fmtPct = (n: number) => `${n.toFixed(2)}%`;

    // ── Kalkulasi angka kontekstual di server (agar AI bisa langsung pakai) ──
    const sorted = [...peserta].sort((a: any, b: any) => a.harga - b.harga);
    const winnerData = peserta.find((p: any) => p.isWinner);
    const winnerHarga = winnerData?.harga || 0;

    // Parse pagu & hps (bisa format "Rp 3.000.000.000,00" atau angka mentah)
    const parseRp = (s: string) => {
      const match = s?.match(/([\d.]+(?:,\d+)?)/);
      if (!match) return 0;
      return parseFloat(match[1].replace(/\./g, "").replace(",", ".")) || 0;
    };
    const paguNum = parseRp(pagu) || 0;
    const hpsNum  = parseRp(hps)  || 0;

    const dropPctHPS  = hpsNum  > 0 ? (hpsNum  - winnerHarga) / hpsNum  * 100 : 0;
    const dropPctPagu = paguNum > 0 ? (paguNum - winnerHarga) / paguNum * 100 : 0;

    const highest = sorted[sorted.length - 1]?.harga || 0;
    const lowest  = sorted[0]?.harga || 0;
    const rangeAbs = highest - lowest;
    const rangePct = lowest > 0 ? rangeAbs / lowest * 100 : 0;
    const jumlahPeserta = sorted.length;

    // Selisih pemenang dengan peserta terdekat kedua
    const runnerUp = sorted.filter((p: any) => !p.isWinner)[0];
    const selisihRunnerUp = runnerUp ? Math.abs(winnerHarga - runnerUp.harga) : 0;
    const selisihRunnerUpPct = runnerUp && runnerUp.harga > 0 ? selisihRunnerUp / runnerUp.harga * 100 : 0;

    // Daftar peserta dengan info lengkap
    const pesertaStr = sorted
      .map((p: any, i: number) => {
        const pctDariHPS  = hpsNum  > 0 ? fmtPct((p.harga / hpsNum)  * 100) : "-";
        const pctDariPagu = paguNum > 0 ? fmtPct((p.harga / paguNum) * 100) : "-";
        return `${i + 1}. ${p.nama}${p.isWinner ? " ✅ PEMENANG" : ""}\n   Harga: ${fmt(p.harga)} | ${pctDariHPS} dari HPS | ${pctDariPagu} dari Pagu`;
      })
      .join("\n");

    const statsBlock = `
STATISTIK KALKULASI (sudah dihitung, wajib dikutip):
- Jumlah peserta: ${jumlahPeserta} perusahaan
- Harga terendah: ${fmt(lowest)}
- Harga tertinggi: ${fmt(highest)}
- Rentang harga (spread): ${fmt(rangeAbs)} (${fmtPct(rangePct)} dari harga terendah)
${winnerData ? `- Harga pemenang: ${fmt(winnerHarga)} (${fmtPct(dropPctHPS)} di bawah HPS / ${fmtPct(dropPctPagu)} di bawah Pagu)
${runnerUp ? `- Selisih pemenang vs runner-up (${runnerUp.nama}): ${fmt(selisihRunnerUp)} (${fmtPct(selisihRunnerUpPct)})` : ""}` : `- Harga terendah saat ini: ${fmt(lowest)} (${hpsNum > 0 ? fmtPct((hpsNum - lowest) / hpsNum * 100) : "-"} di bawah HPS)`}`;

    const prompt = `Kamu adalah analis pengadaan barang/jasa pemerintah (LPSE) Indonesia yang berpengalaman. Tugasmu menganalisis dinamika persaingan harga lelang (baik yang sudah selesai maupun yang masih berlangsung) secara tajam, spesifik, dan berbasis angka.

ATURAN KERAS:
1. WAJIB menyebut angka spesifik (Rp, %) dari data yang sudah disediakan — jangan buat narasi tanpa angka.
2. DILARANG menulis saran generik seperti "pastikan memenuhi persyaratan administrasi" — itu sudah semua orang tahu.
3. Sebutkan SECARA EKSPLISIT metode evaluasi apa yang kamu asumsikan (harga terendah, sistem nilai, kualitas-harga, dll).
4. Level kompetisi HARUS dijelaskan cara menghitungnya (dari rentang/spread harga antar peserta).
5. Pelajaran HARUS spesifik ke data lelang ini — bukan panduan umum.

DATA LELANG:
- Nama Paket: ${nama_paket}
- Nilai Pagu: ${pagu || "-"}
- Nilai HPS: ${hps || "-"}
- Pemenang: ${pemenang_nama || "-"}
${statsBlock}

DAFTAR PESERTA (diurutkan dari harga terendah):
${pesertaStr}

Jawab dalam format JSON MURNI (tanpa pengantar, tanpa markdown code block):

{
  "ringkasan": "2-3 kalimat dengan menyebut angka kunci: jumlah peserta, rentang harga, dan posisi harga terendah/pemenang terhadap HPS",
  "analisis_selisih": "Jelaskan persaingan antar peserta dengan angka — seberapa rapat/longgar spread-nya? Siapa yang paling agresif dan siapa yang terlalu tinggi?",
  "strategi_pemenang": "Analisis spesifik mengenai harga penawar terendah (atau pemenang jika ada): posisinya di antara peserta, jarak dari HPS, dan apakah harganya agresif (berpeluang menang) atau justru berisiko gugur karena di bawah 80% HPS",
  "asumsi_metode": "Sebutkan secara eksplisit metode evaluasi yang kamu asumsikan (misal: harga terendah-teknis lulus, atau sistem nilai), dan mengapa kamu mengasumsikan itu",
  "pelajaran": "3 poin pelajaran/strategi SPESIFIK berbasis angka dari data ini untuk memenangkan lelang serupa (format: poin 1 | poin 2 | poin 3)",
  "level_kompetisi": "Rendah | Sedang | Tinggi",
  "alasan_level": "Jelaskan cara menghitung level-nya: dari spread/rentang harga peserta, yaitu X% dari harga terendah"
}`;

    const aiText = await askAI({
      model: MODELS.GEMINI_FLASH,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 800,
      temperature: 0.3,
    });

    let analysis: any = null;
    try {
      const clean = aiText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) analysis = JSON.parse(match[0]);
    } catch {
      analysis = { ringkasan: aiText };
    }

    // ── Simpan Hasil ke Database ──
    if (lelangId && analysis) {
      await connectToDatabase();
      await TenderModel.updateOne(
        { lelangId },
        { 
          $set: { 
            analysis_bidding: analysis,
            analysis_cached_at: new Date()
          } 
        }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error("[analyze-bidding] Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menganalisis strategi lelang" }, { status: 500 });
  }
}
