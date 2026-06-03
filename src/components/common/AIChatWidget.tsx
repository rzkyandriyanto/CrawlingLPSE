"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { useDashboard } from "@/app/dashboard/DashboardContext";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function AIChatWidget() {
  const { user, language } = useDashboard();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Add empty assistant message that will be filled by stream
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userContext: {
            perusahaan: user?.perusahaan || user?.nama,
            kota: user?.kota,
            bidang: user?.tag,
          },
        }),
      });

      if (!res.ok || !res.body) throw new Error("Gagal menghubungi AI");

      // Stream response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const json = JSON.parse(data);
            const delta = json?.choices?.[0]?.delta?.content || "";
            if (delta) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: updated[updated.length - 1].content + delta,
                };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Maaf, terjadi kesalahan. Coba lagi ya.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* ── Floating Button ────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center cursor-pointer"
        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
        aria-label="Buka TenderAI Chat"
        id="ai-chat-toggle"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pulse ring */}
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }} />
        )}
      </motion.button>

      {/* ── Chat Panel ──────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-6 z-[89] w-[92vw] sm:w-[380px] flex flex-col rounded-2xl shadow-2xl border overflow-hidden"
            style={{
              height: "520px",
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-primary)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b flex-shrink-0"
              style={{ borderColor: "var(--border-subtle)", background: "linear-gradient(135deg, #7c3aed22, #4f46e511)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-sm" style={{ color: "var(--text-primary)" }}>TenderAI</p>
                <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                  {language === "EN" ? "AI Tender Assistant" : "Asisten Tender Cerdas"}
                </p>
              </div>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                Online
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #7c3aed22, #4f46e511)" }}>
                    <Sparkles className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="font-extrabold text-sm" style={{ color: "var(--text-primary)" }}>
                    {language === "EN" ? "Ask anything about tenders!" : "Tanya apa saja tentang tender!"}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {language === "EN"
                      ? "e.g. \"What is HPS?\", \"Find construction tenders in Jakarta\""
                      : "mis. \"Apa itu HPS?\", \"Cara mengikuti tender konstruksi\""}
                  </p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user" ? "bg-[var(--accent)]" : "bg-violet-600"
                  }`}>
                    {msg.role === "user"
                      ? <User className="w-3.5 h-3.5 text-white" />
                      : <Bot className="w-3.5 h-3.5 text-white" />
                    }
                  </div>
                  {/* Bubble */}
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "rounded-tr-sm text-white"
                      : "rounded-tl-sm"
                  }`}
                    style={msg.role === "user"
                      ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }
                      : { backgroundColor: "var(--bg-secondary)", color: "var(--text-primary)" }
                    }>
                    {msg.content || (
                      <span className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="flex items-end gap-2.5 px-3 py-3 border-t flex-shrink-0"
              style={{ borderColor: "var(--border-subtle)" }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={language === "EN" ? "Ask about tenders..." : "Tanya tentang tender..."}
                rows={1}
                disabled={streaming}
                className="flex-1 resize-none text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-primary)",
                  color: "var(--text-primary)",
                  maxHeight: "100px",
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 100) + "px";
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || streaming}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                id="ai-chat-send"
              >
                {streaming
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white" />
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
