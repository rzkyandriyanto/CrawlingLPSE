import { NextRequest, NextResponse } from "next/server";
import { askAI, MODELS } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lelangId, question, history = [], tenderData } = body;

    if (!question) {
      return NextResponse.json({ error: "Pertanyaan diperlukan" }, { status: 400 });
    }

    // Build context
    let contextStr = "Tidak ada konteks tender.";
    if (tenderData) {
      contextStr = `
- Nama Paket: ${tenderData.nama_paket || tenderData.nama_produk || "-"}
- Instansi: ${tenderData.instansi || "-"}
- Nilai Pagu: ${tenderData.pagu || "-"}
- Nilai HPS: ${tenderData.hps || "-"}
- Tahap Saat Ini: ${tenderData.tahap_saat_ini || "Tidak diketahui"}
- Syarat Kualifikasi (Potongan): ${tenderData.syarat_kualifikasi ? tenderData.syarat_kualifikasi.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim().substring(0, 1500) : "Tidak ada"}
      `.trim();
    }

    const systemPrompt = `Kamu adalah pakar pengadaan barang/jasa pemerintah (LPSE) di Indonesia.
Kamu sedang membantu pengguna yang bertanya tentang sebuah tender spesifik.
Jawablah pertanyaan pengguna dengan jelas, singkat, profesional, dan to the point.
Jika pertanyaannya mengenai kualifikasi, periksa bagian syarat kualifikasi jika tersedia di konteks.
Jika pengguna menanyakan strategi analisis, peluang menang, atau strategi harga penawaran, berikan analisis yang komprehensif. Analisis tersebut harus mencakup tingkat persaingan, saran efisiensi harga penawaran (dibandingkan dengan HPS/Pagu), serta langkah-langkah taktis untuk memenangkan tender ini.
Gunakan format paragraf atau list markdown yang rapi.

**Konteks Tender:**
${contextStr}
`;

    // Map history
    const messages = history.map((msg: any) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content
    }));

    // Add system message at the beginning
    messages.unshift({ role: "system", content: systemPrompt });

    // Add current question
    messages.push({ role: "user", content: question });

    const aiText = await askAI({
      model: MODELS.GEMINI_FLASH,
      messages: messages,
      maxTokens: 500,
      temperature: 0.5,
    });

    return NextResponse.json({ answer: aiText });
  } catch (error: any) {
    console.error("[chat-tender] Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menghubungi AI" }, { status: 500 });
  }
}
