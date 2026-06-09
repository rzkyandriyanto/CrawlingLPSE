"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2, History, Plus, Trash2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDashboard } from "@/app/dashboard/DashboardContext";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

const DetailLinkButton = ({ tenderId, children, setSelectedItem }: { tenderId: string, children: React.ReactNode, setSelectedItem: any }) => {
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
          const res = await fetch(`/api/tenders/detail?id=${encodeURIComponent(tenderId)}`);
          if (!res.ok) throw new Error("Gagal mengambil data tender");
          const data = await res.json();
          if (data.tender) setSelectedItem(data.tender);
        } catch (err) {
          console.error(err);
          alert("Gagal membuka detail tender.");
        } finally {
          setLoading(false);
        }
      }}
      className={`text-violet-600 hover:text-violet-700 font-bold transition-all cursor-pointer outline-none bg-transparent inline-flex items-center gap-1.5 ${loading ? "animate-pulse opacity-70" : "hover:underline"}`}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
};

export default function AIChatWidget() {
  const { user, language, setSelectedItem } = useDashboard();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("tender_ai_chats");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
          setMessages(parsed[0].messages);
        }
      } catch {}
    }
  }, []);

  // Save history on changes
  useEffect(() => {
    if (messages.length === 0 && !activeSessionId) return;
    if (!streaming && messages.length > 0) {
      setSessions(prev => {
        let updated = [...prev];
        let currentIdx = updated.findIndex(s => s.id === activeSessionId);
        const newId = activeSessionId || Date.now().toString();
        if (!activeSessionId) setActiveSessionId(newId);

        // Helper to generate a meaningful title
        const generateTitle = (msgs: Message[]) => {
          const userMsgs = msgs.filter(m => m.role === "user");
          let targetMsg = userMsgs[0];
          for (const msg of userMsgs) {
            // Find first message that is somewhat descriptive
            if (msg.content.length > 15 || msg.content.split(" ").length > 3) {
              targetMsg = msg;
              break;
            }
          }
          if (!targetMsg) return "Chat Baru";
          let t = targetMsg.content.trim();
          t = t.charAt(0).toUpperCase() + t.slice(1);
          return t.length > 35 ? t.slice(0, 35) + "..." : t;
        };

        const sessionTitle = generateTitle(messages);

        if (currentIdx === -1) {
          const newSession = {
            id: newId,
            title: sessionTitle,
            messages: messages,
            updatedAt: Date.now()
          };
          updated = [newSession, ...updated];
        } else {
          updated[currentIdx] = {
            ...updated[currentIdx],
            title: sessionTitle, // Update title dynamically as conversation progresses
            messages: messages,
            updatedAt: Date.now()
          };
          // move to top if not already
          if (currentIdx !== 0) {
            const session = updated.splice(currentIdx, 1)[0];
            updated.unshift(session);
          }
        }
        localStorage.setItem("tender_ai_chats", JSON.stringify(updated));
        return updated;
      });
    }
  }, [messages, streaming, activeSessionId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // Focus input when opened
  useEffect(() => {
    if (open && !showHistory) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open, showHistory]);

  const handleNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    setShowHistory(false);
  };

  const loadSession = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setMessages(session.messages);
      setActiveSessionId(id);
      setShowHistory(false);
    }
  };
  
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    localStorage.setItem("tender_ai_chats", JSON.stringify(newSessions));
    if (activeSessionId === id) {
      handleNewChat();
    }
  };

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

      if (!res.ok) {
        let errMsg = "Gagal menghubungi AI";
        try {
          const errData = await res.json();
          if (errData.error) errMsg = errData.error;
        } catch {}
        throw new Error(errMsg);
      }
      if (!res.body) throw new Error("Gagal menghubungi AI");

      const contentType = res.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: json.content,
          };
          return updated;
        });
        return;
      }

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
      let finalMsg = err.message || "Maaf, terjadi kesalahan. Coba lagi ya.";
      if (finalMsg.toLowerCase().includes("credits") || finalMsg.toLowerCase().includes("afford")) {
        finalMsg = "Maaf, akun OpenRouter API Anda kehabisan kredit/saldo untuk memproses permintaan ini. Silakan isi ulang kredit Anda di OpenRouter.";
      }
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: finalMsg,
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
              <div className="flex-1">
                <p className="font-extrabold text-sm" style={{ color: "var(--text-primary)" }}>TenderAI</p>
                <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>
                  {language === "EN" ? "AI Tender Assistant" : "Asisten Tender Cerdas"}
                </p>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-1.5 rounded-lg transition-colors ${showHistory ? 'bg-violet-100 text-violet-700' : 'text-gray-500 hover:bg-gray-100'}`}
                  title="Riwayat Chat"
                >
                  <History className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleNewChat}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                  title="Chat Baru"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            {showHistory ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-500">Riwayat Obrolan</h3>
                {sessions.length === 0 ? (
                  <div className="text-center text-sm text-gray-400 py-8">Belum ada riwayat chat</div>
                ) : (
                  sessions.map(session => (
                    <div 
                      key={session.id}
                      onClick={() => loadSession(session.id)}
                      className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center gap-3 group ${activeSessionId === session.id ? 'border-violet-300 bg-violet-50/50' : 'border-transparent hover:bg-gray-50'}`}
                    >
                      <MessageCircle className={`w-5 h-5 flex-shrink-0 ${activeSessionId === session.id ? 'text-violet-500' : 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${activeSessionId === session.id ? 'text-violet-700' : 'text-gray-700'}`}>
                          {session.title}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(session.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => deleteSession(session.id, e)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
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
                    {msg.content ? (
                      msg.role === "assistant" ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                            a: ({node, ...props}) => {
                              const href = props.href || "";
                              if (href.startsWith("/dashboard?view=detail&id=")) {
                                const idMatch = href.match(/id=([^&]+)/);
                                if (idMatch) {
                                  return (
                                    <DetailLinkButton tenderId={idMatch[1]} setSelectedItem={setSelectedItem}>
                                      {props.children}
                                    </DetailLinkButton>
                                  );
                                }
                              }
                              return <a className="text-violet-600 hover:text-violet-700 hover:underline font-bold transition-colors" target="_blank" rel="noopener noreferrer" {...props} />;
                            },
                            blockquote: ({node, ...props}) => (
                              <blockquote 
                                className="my-3 p-3 rounded-xl border border-violet-200 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden" 
                                style={{ borderLeft: "4px solid #7c3aed" }}
                                {...props} 
                              />
                            ),
                            table: ({node, ...props}) => (
                              <div className="overflow-x-auto my-4 w-full rounded-xl border border-violet-100 shadow-sm custom-scrollbar">
                                <table className="w-full text-left border-collapse min-w-[500px]" {...props} />
                              </div>
                            ),
                            thead: ({node, ...props}) => <thead className="bg-violet-50/50 text-violet-900 text-xs uppercase tracking-wide" {...props} />,
                            tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-violet-50" {...props} />,
                            tr: ({node, ...props}) => <tr className="hover:bg-violet-50/30 transition-colors" {...props} />,
                            th: ({node, ...props}) => <th className="p-3 font-semibold border-b border-violet-100 whitespace-nowrap" {...props} />,
                            td: ({node, ...props}) => <td className="p-3 text-xs align-middle" {...props} />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        msg.content
                      )
                    ) : (
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
            )}

            {/* Input Area */}
            {!showHistory && (
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
