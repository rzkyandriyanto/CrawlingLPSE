/**
 * OpenRouter API Client
 * Unified wrapper untuk semua AI calls di aplikasi ini.
 * Selalu dipanggil dari server-side (Next.js API routes) — bukan dari browser.
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterOptions = {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
};

const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Panggil OpenRouter API dan return Response object.
 * Untuk non-streaming: await res.json() langsung.
 * Untuk streaming: return res ke client agar bisa di-pipe.
 */
export async function callOpenRouter(options: OpenRouterOptions): Promise<Response> {
  const {
    model,
    messages,
    stream = false,
    maxTokens = 1024,
    temperature = 0.7,
  } = options;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY tidak ditemukan di environment variables.");
  }

  const res = await fetch(OPENROUTER_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Tender Monitor - Kerja Praktik",
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!res.ok && !stream) {
    const errText = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${errText}`);
  }

  return res;
}

/**
 * Helper: panggil OpenRouter dan langsung return teks jawaban (non-streaming).
 */
export async function askAI(options: Omit<OpenRouterOptions, "stream">): Promise<string> {
  const res = await callOpenRouter({ ...options, stream: false });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

// ── Model constants ────────────────────────────────────────────────────────
export const MODELS = {
  /** Cepat & murah, cocok untuk ringkasan & rekomendasi */
  GEMINI_FLASH: "google/gemini-2.5-flash",
  /** Kualitas tinggi untuk analisis struktural */
  CLAUDE_HAIKU: "anthropic/claude-3.5-haiku",
  /** Fallback gratis */
  MISTRAL_FREE: "mistralai/mistral-7b-instruct:free",
} as const;

