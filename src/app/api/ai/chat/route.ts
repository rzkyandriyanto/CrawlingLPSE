import { NextRequest } from "next/server";
import { callOpenRouter, MODELS, ChatMessage } from "@/lib/openrouter";
import dbConnect from "@/lib/mongoose";
import { TenderModel } from "@/models/Tender";

/**
 * Tools definition for OpenRouter
 */
const tools = [
  {
    type: "function",
    function: {
      name: "cari_tender",
      description: "Mencari data tender terbaru dari database berdasarkan kriteria pengguna. Pastikan untuk selalu menggunakan fungsi ini jika user mencari tender.",
      parameters: {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description: "Kata kunci spesifik untuk mencari judul/nama tender (misal: 'puskesmas', 'jalan', 'sekolah', 'rumah sakit'). Kosongkan jika tidak spesifik."
          },
          kategori: {
            type: "string",
            description: "Kategori pekerjaan, contoh: 'Konstruksi', 'Jasa', 'Barang'. Kosongkan jika tidak spesifik."
          },
          min_hps: {
            type: "number",
            description: "Batas minimal nilai HPS dalam format angka integer"
          },
          max_hps: {
            type: "number",
            description: "Batas maksimal nilai HPS dalam format angka integer"
          },
          wilayah: {
            type: "string",
            description: "Nama kota, kabupaten, atau provinsi. Kosongkan jika mencari di seluruh Indonesia."
          }
        }
      }
    }
  }
];

/**
 * POST /api/ai/chat
 * Body: { messages: ChatMessage[], userContext: { perusahaan, kota, bidang } }
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
- Bantu user mencari tender dengan menggunakan fungsi cari_tender jika diminta.
- Jika fungsi cari_tender mengembalikan data, sajikan seluruh tender tersebut dalam format Tabel Markdown. Ini WAJIB agar UI merendernya sebagai tabel interaktif. Format kolom tabelnya harus seperti ini:
| Nama Paket Tender | HPS | Instansi | Link Detail |
|---|---|---|---|
| (nama) | (hps) | (instansi) | [Lihat Detail](/dashboard?view=detail&id=LELANG_ID_DISINI) |

- Jangan tampilkan url asli, pastikan kolom Link Detail menggunakan teks "Lihat Detail" dengan format markdown link ke \`/dashboard?view=detail&id=...\`.
- Jawab dalam Bahasa Indonesia yang ramah dan profesional.
- Jika tidak tahu, katakan dengan jujur.

Jangan jawab pertanyaan yang tidak berkaitan dengan tender/pengadaan/bisnis.`;

    const allMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // PASS 1: Check for tool calls (stream: false)
    const pass1 = await callOpenRouter({
      model: MODELS.GEMINI_FLASH,
      messages: allMessages,
      stream: false,
      maxTokens: 250,
      temperature: 0.2, // Rendah untuk tool calling yang presisi
      tools: tools,
      tool_choice: "auto",
    });

    if (!pass1.ok) {
      const errText = await pass1.text();
      let errMsg = "OpenRouter error.";
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error && parsed.error.message) errMsg = parsed.error.message;
      } catch {}
      return new Response(
        JSON.stringify({ error: errMsg }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const data1 = await pass1.json();
    const responseMessage = data1.choices?.[0]?.message;

    // Check if AI called a tool
    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      
      if (toolCall.function.name === "cari_tender") {
        const args = JSON.parse(toolCall.function.arguments || "{}");
        
        // Execute MongoDB query
        await dbConnect();
        
        let query: any = {};
        if (args.keyword) {
           query.nama_paket = { $regex: args.keyword, $options: "i" };
        }
        if (args.kategori) {
           query.kategori = { $regex: args.kategori, $options: "i" };
        }
        if (args.wilayah) {
           query.wilayah = { $regex: args.wilayah, $options: "i" };
        }
        if (args.min_hps || args.max_hps) {
           query.hps_num = {};
           if (args.min_hps) query.hps_num.$gte = args.min_hps;
           if (args.max_hps) query.hps_num.$lte = args.max_hps;
        }

        // Ambil 5 tender terbaru
        const tenders = await TenderModel.find(query)
          .sort({ tanggal_pembuatan: -1 })
          .limit(5)
          .select("nama_paket instansi kategori pagu hps url_lpse lelangId wilayah")
          .lean();
        
        const toolResult = {
          hasil_pencarian: tenders.length > 0 ? tenders : "Tidak ditemukan tender yang sesuai dengan kriteria."
        };

        // Append to messages for Pass 2
        allMessages.push(responseMessage); // Assistant's tool_call message
        allMessages.push({
          role: "tool",
          content: JSON.stringify(toolResult),
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
        });

        // PASS 2: Get final streaming response
        const pass2 = await callOpenRouter({
          model: MODELS.GEMINI_FLASH,
          messages: allMessages,
          stream: true,
          maxTokens: 500,
          temperature: 0.7,
        });

        if (!pass2.ok) {
           const errText = await pass2.text();
           let errMsg = "Gagal memproses jawaban (Pass 2).";
           try {
             const parsed = JSON.parse(errText);
             if (parsed.error && parsed.error.message) errMsg = parsed.error.message;
           } catch {}
           console.error("Pass 2 failed with:", errText);
           throw new Error(errMsg);
        }

        return new Response(pass2.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
    }

    // Jika tidak ada tool calls, berarti Pass 1 sudah merupakan jawaban final.
    // Karena Pass 1 menggunakan stream: false, kita akan me-return JSON langsung
    return new Response(
      JSON.stringify({ content: responseMessage?.content || "" }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("[ai/chat] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Gagal menghubungi AI" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
