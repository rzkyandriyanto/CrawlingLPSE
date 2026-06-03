import { NextRequest } from "next/server";
import { callOpenRouter, MODELS } from "@/lib/openrouter";

/**
 * POST /api/ai/chat
 * Body: { messages: ChatMessage[], userContext: { perusahaan, kota, bidang } }
 *
 * Returns a streaming text/event-stream response (Server-Sent Events).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], userContext = {} } = body;

    const { perusahaan, kota, bidang } = userContext;

    const systemPrompt = `Kamu adalah asisten cerdas untuk aplikasi monitoring tender pengadaan pemerintah Indonesia.
Nama kamu adalah "TenderAI".

${perusahaan ? `Pengguna ini berasal dari perusahaan: ${perusahaan}.` : ""}
${kota ? `Lokasi perusahaan: ${kota}.` : ""}
${bidang ? `Bidang usaha: ${Array.isArray(bidang) ? bidang.join(", ") : bidang}.` : ""}

Tugas kamu:
- Jawab pertanyaan seputar tender, pengadaan pemerintah, LPSE, dan proses lelang di Indonesia
- Bantu user memahami istilah-istilah pengadaan (HPS, pagu, metode pengadaan, dll.)
- Berikan saran strategis untuk mengikuti tender yang sesuai profil perusahaan user
- Jawab dalam Bahasa Indonesia yang ramah dan profesional
- Jika tidak tahu, katakan dengan jujur

Jangan jawab pertanyaan yang tidak berkaitan dengan tender/pengadaan/bisnis.`;

    const allMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages,
    ];

    // Panggil OpenRouter dengan streaming
    const upstream = await callOpenRouter({
      model: MODELS.GEMINI_FLASH,
      messages: allMessages,
      stream: true,
      maxTokens: 800,
      temperature: 0.7,
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return new Response(
        JSON.stringify({ error: `OpenRouter error: ${err}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Pipe upstream SSE stream langsung ke client
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("[ai/chat] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Gagal menghubungi AI" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
