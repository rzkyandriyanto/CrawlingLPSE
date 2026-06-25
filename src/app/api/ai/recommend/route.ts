import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";
import { askAI, MODELS } from "@/lib/openrouter";

/**
 * POST /api/ai/recommend
 * Body: { userId, tag, kota, perusahaan, bidang[] }
 *
 * Return: { recommendations: [{ lelangId, nama_paket, alasan }] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tag, kota, perusahaan, bidang = [], nilai_kontrak_maksimal, kbli, sbu, wilayah_operasi } = body;

    await connectToDatabase();

    // Ambil 40 tender terbaru dari DB sebagai kandidat (hanya yang aktif dan tidak batal/gagal)
    const tenders = await TenderModel.find({
      status: "aktif",
      nama_paket: { $not: /batal|gagal/i },
      tahap_saat_ini: { $not: /batal|gagal/i }
    })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean() as any[];

    if (tenders.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Build daftar tender singkat untuk dikirim ke AI
    const tenderList = tenders
      .map((t: any, i: number) =>
        `${i + 1}. [${t.lelangId}] ${t.nama_paket} | ${t.kategori || "-"} | ${t.wilayah || "-"} | HPS: ${t.hps || "-"}`
      )
      .join("\n");

    const userContext = [
      perusahaan ? `Nama Perusahaan: ${perusahaan}` : null,
      kota ? `Lokasi: ${kota}` : null,
      wilayah_operasi ? `Wilayah Operasi: ${Array.isArray(wilayah_operasi) ? wilayah_operasi.join(", ") : wilayah_operasi}` : null,
      tag ? `Bidang/Tag: ${Array.isArray(tag) ? tag.join(", ") : tag}` : null,
      bidang.length > 0 ? `Bidang Usaha: ${bidang.join(", ")}` : null,
      kbli ? `KBLI: ${Array.isArray(kbli) ? kbli.join(", ") : kbli}` : null,
      sbu ? `SBU: ${Array.isArray(sbu) ? sbu.join(", ") : sbu}` : null,
      nilai_kontrak_maksimal ? `Nilai Kontrak Maksimal: Rp ${Number(nilai_kontrak_maksimal).toLocaleString("id-ID")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const prompt = `Kamu adalah sistem rekomendasi tender pengadaan pemerintah Indonesia.

**Profil Perusahaan Pencari:**
${userContext || "Profil tidak tersedia, gunakan penilaian umum."}

**Daftar Tender Tersedia (format: nomor. [lelangId] nama | kategori | wilayah | HPS):**
${tenderList}

Pilih TEPAT 5 tender yang paling relevan dan cocok untuk perusahaan di atas.
ATURAN WAJIB (STRICT FILTERS):
1. NILAI PAGU/HPS: Jika ada Nilai Kontrak Maksimal, JANGAN merekomendasikan tender dengan HPS/Pagu di atas nilai tersebut (tidak realistis).
2. KBLI & SBU: Jika ada KBLI/SBU, PRIORITASKAN tender yang sesuai atau mensyaratkan kualifikasi tersebut.
3. NEGATIVE FILTER WILAYAH: JANGAN rekomendasikan tender yang wilayahnya TIDAK ADA dalam Wilayah Operasi perusahaan (jika wilayah operasi spesifik disebutkan). Jika wilayah operasi kosong, prioritaskan lokasi/kota.

Balas HANYA dengan JSON berikut:
{
  "recommendations": [
    { 
      "lelangId": "xxx", 
      "alasan": "1 kalimat alasan singkat",
      "skor": 85,
      "alasan_skor": "bidang cocok+wilayah cocok+pagu sesuai"
    },
    ... (ulangi TEPAT 5 tender)
  ]
}`;

    const aiText = await askAI({
      model: MODELS.GEMINI_FLASH,
      messages: [{ role: "user", content: prompt }],
      maxTokens: 500,
      temperature: 0.3,
    });

    // Parse JSON response
    let recs: any[] = [];
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        recs = parsed.recommendations || [];
      }
    } catch {
      console.warn("[recommend] Gagal parse JSON dari AI:", aiText);
    }

    // Enrich dengan data tender lengkap dari DB
    const enriched = recs
      .map((rec: any) => {
        const tender = tenders.find((t: any) => t.lelangId === rec.lelangId);
        if (!tender) return null;
        return {
          lelangId: tender.lelangId,
          nama_paket: tender.nama_paket,
          instansi: tender.instansi,
          kategori: tender.kategori,
          wilayah: tender.wilayah,
          pagu: tender.pagu,
          hps: tender.hps,
          metode_pengadaan: tender.metode_pengadaan,
          url_lpse: tender.url_lpse,
          jadwal: tender.jadwal,
          alasan: rec.alasan,
          skor: rec.skor,
          alasan_skor: rec.alasan_skor,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ recommendations: enriched });
  } catch (error: any) {
    console.error("[recommend] Error:", error);
    return NextResponse.json({ error: error.message || "Gagal mendapatkan rekomendasi" }, { status: 500 });
  }
}
