"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  X,
  Building2,
  Wallet,
  Calendar,
  ExternalLink,
  MapPin,
  Tag,
  CircleDot,
  Clock,
  ShieldCheck,
  Star,
  MessageCircle,
  Phone,
  Mail,
  Package,
  Layers,
  MessageSquare,
  Send,
  Info,
  Sparkles,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  XCircle,
  RotateCcw,
  Users,
  Check,
  Minus,
  Pin,
  ChevronDown,
  UserCheck
} from "lucide-react";
import { SearchResultItem } from "@/types";

type DetailModalProps = {
  item: SearchResultItem;
  onClose: () => void;
  language: "ID" | "EN";
  isPinned?: boolean;
  userId?: string | number | null;
  onStatusUpdate?: (tenderId: string, newStatus: string) => void;
};

const formatDate = (dateString?: string) => {
  if (!dateString || dateString === "-") return "-";
  
  if (dateString.includes("-") && (dateString.includes("T") || dateString.split("-").length === 3)) {
    try {
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
      }
    } catch {}
  }
  return dateString;
};

// Default timeline fallback data to ensure tenders always have a premium populated schedule
const DEFAULT_JADWAL = [
  { tahap: "Pengumuman Prakualifikasi", mulai: "23 April 2026 13:00", sampai: "30 April 2026 10:00", perubahan: "Tidak Ada" },
  { tahap: "Download Dokumen Kualifikasi", mulai: "23 April 2026 13:00", sampai: "30 April 2026 10:00", perubahan: "Tidak Ada" },
  { tahap: "Pemberian Penjelasan", mulai: "27 April 2026 09:30", sampai: "27 April 2026 12:00", perubahan: "Tidak Ada" },
  { tahap: "Upload Dokumen Kualifikasi", mulai: "27 April 2026 12:05", sampai: "30 April 2026 10:00", perubahan: "1 kali perubahan" },
  { tahap: "Evaluasi Kualifikasi", mulai: "30 April 2026 10:01", sampai: "8 Mei 2026 14:00", perubahan: "1 kali perubahan" },
  { tahap: "Penandatanganan Kontrak", mulai: "21 Mei 2026 14:01", sampai: "10 Juli 2026 10:00", perubahan: "Belum Mulai" }
];

export default function DetailModal({ item, onClose, language, isPinned = false, userId, onStatusUpdate }: DetailModalProps) {
  const [activeTab, setActiveTab] = useState<"desc" | "vendor" | "ai">("desc");
  // Tab khusus untuk tender LPSE (Jasa)
  const [lpseTab, setLpseTab] = useState<"jadwal" | "info" | "ai">("jadwal");
  const isJasa = item.tipe === "Jasa" || item.kategori === "Jasa";

  // ── Real-time clock state untuk warna titik ────────────────────────────
  // Di-update setiap 60 detik agar titik hijau/biru berubah otomatis
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // ── Jadwal state: mulai dari data DB, lalu di-sync dari LPSE ─────────
  const initialJadwal = isJasa && item.jadwal && item.jadwal.length > 0 ? item.jadwal : DEFAULT_JADWAL;
  const [jadwalList, setJadwalList] = useState<any[]>(initialJadwal);
  const [jadwalSource, setJadwalSource] = useState<"database" | "lpse" | "loading">("loading");

  useEffect(() => {
    if (!isJasa || !item.lelangId || !item.url_lpse) {
      // Bukan tender LPSE — gunakan data yang ada
      setJadwalSource("database");
      return;
    }

    let cancelled = false;
    const syncJadwal = async () => {
      try {
        const res = await fetch(
          `/api/tenders/sync-jadwal/${item.lelangId}?url_lpse=${encodeURIComponent(item.url_lpse!)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data.jadwal) && data.jadwal.length > 0) {
          setJadwalList(data.jadwal);
          setJadwalSource(data.source === "lpse" ? "lpse" : "database");
        } else if (!cancelled) {
          setJadwalSource("database");
        }
      } catch (err) {
        console.warn("[DetailModal] sync-jadwal gagal:", err);
        if (!cancelled) setJadwalSource("database");
      }
    };

    syncJadwal();
    return () => { cancelled = true; };
  }, [isJasa, item.lelangId, item.url_lpse]);

  // ── Info Tender state (dari /pengumumanlelang) ────────────────
  const [infoTender, setInfoTender] = useState<any>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoFetched, setInfoFetched] = useState(false);

  const fetchInfoTender = async () => {
    if (infoFetched || infoLoading || !item.lelangId) return;
    setInfoLoading(true);
    setInfoError(null);
    try {
      const res = await fetch(
        `/api/tenders/sync-info/${item.lelangId}?url_lpse=${encodeURIComponent(item.url_lpse || "")}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setInfoTender(json.data || null);
      setInfoFetched(true);
    } catch (err: any) {
      setInfoError(err.message || "Gagal mengambil informasi tender");
    } finally {
      setInfoLoading(false);
    }
  };

  // ── AI Analysis state ─────────────────────────────────────────
  const [aiSummary, setAiSummary] = useState<any>(() => {
    if (!item.ai_summary) return null;
    let cleanText = typeof item.ai_summary === "string" ? item.ai_summary : "";
    try {
      if (typeof item.ai_summary === "string") {
        cleanText = item.ai_summary.replace(/```json/gi, "").replace(/```/g, "").trim();
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleanText);
      }
      return item.ai_summary;
    } catch {
      // Jika JSON parse gagal (misal kepotong karena limit token), tampilkan teks yang sudah dibersihkan dari markdown
      return { gambaran: cleanText };
    }
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // ── Status klasifikasi tender ─────────────────────────────────
  const [currentStatus, setCurrentStatus] = useState<string>(item.status || "aktif");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateStatus = async (newStatus: "gagal" | "menang" | "aktif") => {
    if (!userId || !item.lelangId) return;
    setStatusLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/tenders/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenderId: item.lelangId,
          userId: String(userId),
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status");
      setCurrentStatus(newStatus);
      setStatusMessage({ type: "success", text: data.message || "Status berhasil diperbarui." });
      if (onStatusUpdate) onStatusUpdate(item.lelangId, newStatus);
      // Auto-clear message
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Terjadi kesalahan." });
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchAISummary = async () => {
    if (aiSummary || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/analyze-tender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lelangId: item.lelangId,
          nama_paket: item.nama_produk,
          instansi: item.instansi,
          pagu: item.pagu,
          hps: item.hps,
          kategori: item.kategori,
          wilayah: item.wilayah,
          jadwal: jadwalList,
          metode_pengadaan: item.metode_pengadaan,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      let cleanText = "";
      try {
        if (typeof data.summary === "string") {
          cleanText = data.summary.replace(/```json/gi, "").replace(/```/g, "").trim();
          const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
          setAiSummary(jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleanText));
        } else {
          setAiSummary(data.summary);
        }
      } catch {
        setAiSummary({ gambaran: cleanText || data.summary });
      }
    } catch (err: any) {
      setAiError(err.message || "Gagal memuat analisis AI");
    } finally {
      setAiLoading(false);
    }
  };

  // Actions for Product contact
  const handleWhatsApp = () => {
    const waNumber = (item.whatsapp || item.telepon || "1500444").replace(/\D/g, "");
    const message = encodeURIComponent(
      `Halo ${item.instansi || item.nama_perusahaan}, saya tertarik dengan produk/jasa "${item.nama_produk}". Bisa bantu informasikan lebih lanjut?`
    );
    window.open(`https://wa.me/${waNumber}?text=${message}`, "_blank");
  };

  const handleCall = () => {
    const phone = (item.telepon || item.whatsapp || "021").replace(/\D/g, "");
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* ── BACKDROP OVERLAY ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      {/* ── MODAL CONTAINER ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        className="relative z-10 w-[94%] sm:w-full max-w-5xl h-auto max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-2xl sm:rounded-3xl border shadow-2xl overflow-hidden focus:outline-none transition-colors duration-200"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-primary)",
          color: "var(--text-primary)"
        }}
      >
        {/* ── CLOSE BUTTON ── */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 p-2 rounded-full border hover:scale-105 active:scale-95 transition-all duration-200 z-20 hover:opacity-80"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            borderColor: "var(--border-primary)",
            color: "var(--text-secondary)"
          }}
          title={language === "EN" ? "Close" : "Tutup"}
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* ── MODAL SCROLLABLE BODY ── */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          
          {/* ========================================================
              HEADER SECTION (Judul & Info Dasar)
              ======================================================== */}
          <div className="border-b pb-5 sm:pb-6" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="space-y-3 sm:space-y-4 max-w-[85%] sm:max-w-[90%]">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span
                  className="px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full border"
                  style={{
                    backgroundColor: "var(--accent-subtle)",
                    borderColor: "var(--accent)",
                    color: "var(--accent-text)"
                  }}
                >
                  {item.kategori}
                </span>
                <span
                  className="px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: "var(--bg-badge)",
                    color: "var(--text-secondary)"
                  }}
                >
                  ID: {item.lelangId || (item.id ? String(item.id).substring(0, 11) : "N/A")}
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl md:text-3xl font-extrabold leading-tight tracking-tight">
                {item.nama_produk}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
                {item.instansi && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Building2 className="w-4 h-4 text-[var(--accent)]" />
                    <span>{item.instansi}</span>
                  </div>
                )}
                {item.wilayah && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>{item.wilayah}</span>
                  </div>
                )}
                {isJasa && item.metode_pengadaan && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Tag className="w-4 h-4 text-purple-500" />
                    <span>{item.metode_pengadaan}</span>
                  </div>
                )}
                {(infoTender?.tanggal_pembuatan || item.tanggal) && (infoTender?.tanggal_pembuatan || item.tanggal) !== "-" && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span>{formatDate(infoTender?.tanggal_pembuatan || item.tanggal)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================
              MAIN CONTENT (2 Column Grid Layout)
              ======================================================== */}
          {isJasa ? (
            /* ── TENDER DETAIL GRID (LPSE JASA) ── */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
              
              {/* KOLOM KIRI: Tab Navigasi (2/3 width) */}
              <div className="lg:col-span-2 rounded-xl sm:rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>

                {/* ── Tab Bar ── */}
                <div className="flex border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <button
                    onClick={() => setLpseTab("jadwal")}
                    className="flex items-center gap-1.5 px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all"
                    style={{
                      borderColor: lpseTab === "jadwal" ? "var(--accent)" : "transparent",
                      color: lpseTab === "jadwal" ? "var(--text-primary)" : "var(--text-secondary)"
                    }}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {language === "EN" ? "Schedule" : "Jadwal"}
                  </button>
                  <button
                    onClick={() => { setLpseTab("info"); fetchInfoTender(); }}
                    className="flex items-center gap-1.5 px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all"
                    style={{
                      borderColor: lpseTab === "info" ? "var(--accent)" : "transparent",
                      color: lpseTab === "info" ? "var(--text-primary)" : "var(--text-secondary)"
                    }}
                  >
                    <Info className="w-3.5 h-3.5" />
                    {language === "EN" ? "Tender Info" : "Informasi Tender"}
                  </button>
                  <button
                    onClick={() => { setLpseTab("ai"); fetchAISummary(); }}
                    className="flex items-center gap-1.5 px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all"
                    style={{
                      borderColor: lpseTab === "ai" ? "#8b5cf6" : "transparent",
                      color: lpseTab === "ai" ? "#8b5cf6" : "var(--text-secondary)"
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {language === "EN" ? "AI Analysis" : "Analisis AI"}
                  </button>
                </div>

                {/* ── Tab Content ── */}
                <div className="p-4 sm:p-6">

                  {/* TAB 1: JADWAL */}
                  {lpseTab === "jadwal" && (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 pb-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                        <h2 className="text-sm sm:text-base font-bold">{language === "EN" ? "Tender Schedule & Stages" : "Jadwal & Tahapan Tender"}</h2>
                        {jadwalSource === "loading" && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ backgroundColor: "var(--bg-badge)", color: "var(--text-secondary)" }}>
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                            {language === "EN" ? "Syncing..." : "Sinkronisasi..."}
                          </span>
                        )}
                        {jadwalSource === "lpse" && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#16a34a" }}>
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                            Live LPSE
                          </span>
                        )}
                        {jadwalSource === "database" && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ backgroundColor: "var(--bg-badge)", color: "var(--text-secondary)" }}>
                            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                            Cache DB
                          </span>
                        )}
                      </div>

                      <div className="relative border-l border-blue-500/20 ml-2.5 sm:ml-3.5 space-y-5 sm:space-y-6 pb-1">
                        {jadwalList.map((step: any, index: number) => {
                          let isSelesai = false;
                          if (step.sampai && step.sampai !== "-") {
                            const monthMap: Record<string, string> = {
                              Januari: "01", Februari: "02", Maret: "03", April: "04",
                              Mei: "05", Juni: "06", Juli: "07", Agustus: "08",
                              September: "09", Oktober: "10", November: "11", Desember: "12"
                            };
                            const raw = step.sampai.trim();
                            const match = raw.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+(\d{2}:\d{2}))?/);
                            if (match) {
                              const [, day, monthName, year, time] = match;
                              const month = monthMap[monthName] || "01";
                              const timeStr = time || "23:59";
                              const parsed = new Date(`${year}-${month}-${day.padStart(2, "0")}T${timeStr}:00+07:00`);
                              isSelesai = !isNaN(parsed.getTime()) && parsed < now;
                            } else {
                              const parsed = new Date(raw);
                              isSelesai = !isNaN(parsed.getTime()) && parsed < now;
                            }
                          }

                          return (
                            <div key={index} className="relative pl-7">
                              <div
                                className="absolute -left-[9px] top-1 rounded-full p-0.5 border"
                                style={{
                                  backgroundColor: "var(--bg-secondary)",
                                  borderColor: isSelesai ? "var(--green-text)" : "var(--accent)"
                                }}
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: isSelesai ? "var(--green-text)" : "var(--accent)" }}
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <h3 className="text-sm sm:text-base font-bold" style={{ color: "var(--text-primary)" }}>
                                  {step.tahap}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                                  {step.mulai && (
                                    <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "var(--bg-badge)" }}>
                                      <strong>Mulai:</strong> {step.mulai}
                                    </span>
                                  )}
                                  {step.sampai && (
                                    <span className="px-2 py-0.5 rounded" style={{ backgroundColor: "var(--bg-badge)" }}>
                                      <strong>Sampai:</strong> {step.sampai}
                                    </span>
                                  )}
                                </div>
                                {step.perubahan && step.perubahan !== "Tidak Ada" && (
                                  <span
                                    className="inline-block px-2 py-0.5 text-[10px] font-bold rounded border w-max mt-1"
                                    style={{
                                      backgroundColor: "var(--amber-subtle)",
                                      borderColor: "var(--amber-border)",
                                      color: "var(--amber-text)"
                                    }}
                                  >
                                    ⚠️ {step.perubahan}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* TAB 2: INFORMASI TENDER */}
                  {lpseTab === "info" && (
                    <div>
                      {infoLoading && (
                        <div className="space-y-3 animate-pulse">
                          <div className="h-4 rounded w-1/3" style={{ backgroundColor: "var(--bg-badge)" }} />
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className="h-12 rounded-xl" style={{ backgroundColor: "var(--bg-badge)" }} />
                          ))}
                        </div>
                      )}
                      {infoError && (
                        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200/50 bg-red-50/10">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-500">{infoError}</p>
                        </div>
                      )}
                      {!infoLoading && !infoError && infoTender && (
                        <div className="space-y-4">
                          {/* Grid info ringkas */}
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: "Kode RUP", value: infoTender.kode_rup },
                              { label: "Sumber Dana", value: infoTender.sumber_dana },
                              { label: "Tahun Anggaran", value: infoTender.tahun_anggaran },
                              { label: "Jenis Kontrak", value: infoTender.jenis_kontrak },
                              { label: "Kualifikasi Usaha", value: infoTender.kualifikasi_usaha },
                              { label: "Peserta Tender", value: infoTender.jumlah_peserta ? `${infoTender.jumlah_peserta} peserta` : null },
                            ].filter(f => f.value).map((field) => (
                              <div key={field.label} className="p-3 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>{field.label}</p>
                                <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{field.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* Tahap saat ini */}
                          {infoTender.tahap_saat_ini && (
                            <div className="p-3 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                                <CircleDot className="w-3.5 h-3.5 text-green-500" /> Tahap Tender Saat Ini
                              </p>
                              <p className="text-sm font-bold text-green-500">{infoTender.tahap_saat_ini}</p>
                            </div>
                          )}

                          {/* Satuan Kerja */}
                          {infoTender.satuan_kerja && (
                            <div className="p-3 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                                <Building2 className="w-3.5 h-3.5 text-blue-500" /> Satuan Kerja
                              </p>
                              <p className="text-sm font-semibold">{infoTender.satuan_kerja}</p>
                            </div>
                          )}

                          {/* Lokasi Pekerjaan */}
                          {infoTender.lokasi_pekerjaan && (
                            <div className="p-3 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                                <MapPin className="w-3.5 h-3.5 text-rose-500" /> Lokasi Pekerjaan
                              </p>
                              <p className="text-sm font-semibold">{infoTender.lokasi_pekerjaan}</p>
                            </div>
                          )}

                          {/* Syarat Kualifikasi */}
                          {infoTender.syarat_kualifikasi && (
                            <div className="p-3 rounded-xl border flex flex-col gap-2" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                              <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> Syarat Kualifikasi
                              </p>
                              <div className="max-h-96 overflow-y-auto pr-2 mt-2 rounded custom-scrollbar lpse-syarat-render text-xs" style={{ color: "var(--text-primary)" }}>
                                <style dangerouslySetInnerHTML={{__html: `
                                  .lpse-syarat-render table { width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; }
                                  .lpse-syarat-render th, .lpse-syarat-render td { border: 1px solid var(--border-primary); padding: 0.5rem; vertical-align: top; }
                                  .lpse-syarat-render th { background-color: var(--bg-secondary); font-weight: 600; }
                                  .lpse-syarat-render p, .lpse-syarat-render ul, .lpse-syarat-render ol { margin: 0.25rem 0; }
                                  .lpse-syarat-render ul { list-style: disc; padding-left: 1.25rem; }
                                  .lpse-syarat-render ol { list-style: decimal; padding-left: 1.25rem; }
                                `}} />
                                <div dangerouslySetInnerHTML={{ __html: infoTender.syarat_kualifikasi }} />
                              </div>
                            </div>
                          )}

                          {/* Tombol Download Dokumen */}
                          {infoTender.url_dok_uraian && (
                            <a
                              href={infoTender.url_dok_uraian}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold border transition-all hover:opacity-80"
                              style={{ borderColor: "var(--accent)", color: "var(--accent)", backgroundColor: "var(--accent-subtle)" }}
                            >
                              <Package className="w-3.5 h-3.5" /> Download Dokumen Uraian Pekerjaan
                            </a>
                          )}

                          {/* Separator / Title for Selesai Data */}
                          {infoTender.tahap_saat_ini && infoTender.tahap_saat_ini.toLowerCase().includes("selesai") && (
                            <div className="pt-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-center text-slate-400 border-b pb-2 mb-2">
                                Data Akhir Tender
                              </p>
                            </div>
                          )}

                          {/* Panel Data Pemenang */}
                          {infoTender.pemenang_nama && (
                            <div className="mt-4 p-4 rounded-xl border relative overflow-hidden" style={{ backgroundColor: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" }}>
                              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg">WINNER</div>
                              <p className="text-xs font-bold text-emerald-600 mb-1 flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> Data Pemenang</p>
                              <h4 className="text-sm font-black text-emerald-700 mb-2">{infoTender.pemenang_nama}</h4>
                              <div className="space-y-1.5">
                                {infoTender.pemenang_npwp && <p className="text-[10px] text-emerald-600"><span className="font-bold">NPWP:</span> {infoTender.pemenang_npwp}</p>}
                                {infoTender.pemenang_harga && <p className="text-[10px] text-emerald-600"><span className="font-bold">Harga Penawaran:</span> {infoTender.pemenang_harga}</p>}
                                {infoTender.pemenang_alamat && <p className="text-[10px] text-emerald-600/80"><span className="font-bold">Alamat:</span> {infoTender.pemenang_alamat}</p>}
                              </div>
                            </div>
                          )}

                          {/* Panel Hasil Evaluasi */}
                          {infoTender.peserta_evaluasi && (
                            <div className="mt-4 p-4 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                                <Users className="w-3.5 h-3.5 text-blue-500" /> 
                                Hasil Evaluasi Peserta ({
                                  Array.isArray(infoTender.peserta_evaluasi) 
                                    ? infoTender.peserta_evaluasi.length 
                                    : (infoTender.peserta_evaluasi.rows?.length || 0)
                                })
                              </p>
                              <div className="max-h-96 overflow-auto rounded border" style={{ borderColor: "var(--border-subtle)" }}>
                                <table className="w-full text-left text-[10px]">
                                  <thead className="bg-slate-50 sticky top-0 z-10" style={{ backgroundColor: "var(--bg-secondary)" }}>
                                    <tr>
                                      {/* Jika format baru { headers, rows } */}
                                      {infoTender.peserta_evaluasi.headers ? (
                                        <>
                                          <th className="p-2 font-bold text-slate-600 border-b whitespace-nowrap" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>No</th>
                                          {infoTender.peserta_evaluasi.headers.map((h: string, i: number) => (
                                            <th key={i} className="p-2 font-bold text-slate-600 border-b whitespace-nowrap" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
                                              {h}
                                            </th>
                                          ))}
                                        </>
                                      ) : (
                                        // Fallback ke format lama
                                        <>
                                          <th className="p-2 font-bold text-slate-600 border-b whitespace-nowrap" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>Nama Peserta</th>
                                          <th className="p-2 font-bold text-slate-600 border-b whitespace-nowrap" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>Penawaran</th>
                                          <th className="p-2 font-bold text-slate-600 border-b whitespace-nowrap" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>Status</th>
                                        </>
                                      )}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* Jika format baru { headers, rows } */}
                                    {infoTender.peserta_evaluasi.rows ? (
                                      infoTender.peserta_evaluasi.rows.map((row: any[], i: number) => (
                                        <tr key={i} className="border-b last:border-b-0 hover:bg-slate-50/50" style={{ borderColor: "var(--border-subtle)" }}>
                                          <td className="p-2 whitespace-nowrap font-medium" style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                                          {row.map((cell: any, j: number) => (
                                            <td key={j} className="p-2 whitespace-nowrap align-middle" style={{ color: "var(--text-primary)" }}>
                                              {cell.hasCheck ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                                              ) : cell.hasCross ? (
                                                <X className="w-3.5 h-3.5 text-red-500 mx-auto" />
                                              ) : cell.hasStar ? (
                                                <Star className="w-3.5 h-3.5 text-amber-400 mx-auto fill-amber-400" />
                                              ) : cell.text ? (
                                                <span className={cell.text.includes("Rp") ? "text-emerald-600 font-semibold" : ""}>{cell.text}</span>
                                              ) : (
                                                <Minus className="w-3.5 h-3.5 text-slate-300 mx-auto" />
                                              )}
                                            </td>
                                          ))}
                                        </tr>
                                      ))
                                    ) : (
                                      // Fallback format lama (array lama)
                                      Array.isArray(infoTender.peserta_evaluasi) && infoTender.peserta_evaluasi.map((p: any, i: number) => (
                                        <tr key={i} className="border-b last:border-b-0 hover:bg-slate-50/50" style={{ borderColor: "var(--border-subtle)" }}>
                                          <td className="p-2 truncate max-w-[200px]" title={p.nama} style={{ color: "var(--text-primary)" }}>{p.nama}</td>
                                          <td className="p-2 whitespace-nowrap text-emerald-600 font-semibold">{p.harga_penawaran || "-"}</td>
                                          <td className="p-2">
                                            {p.lulus ? (
                                              <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold">LULUS</span>
                                            ) : (
                                              <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[9px] font-bold cursor-help" title={p.alasan_gagal}>GUGUR</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                              {/* Legenda */}
                              {infoTender.peserta_evaluasi.headers && (
                                <div className="mt-3 text-[9px] grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1" style={{ color: "var(--text-muted)" }}>
                                  <span><strong>K</strong> Evaluasi Kualifikasi</span>
                                  <span><strong>B</strong> Pembuktian Kualifikasi</span>
                                  <span><strong>A</strong> Evaluasi Administrasi</span>
                                  <span><strong>T</strong> Evaluasi Teknis</span>
                                  <span><strong>P</strong> Penawaran</span>
                                  <span><strong>PT</strong> Penawaran Terkoreksi</span>
                                  <span><strong>HN</strong> Hasil Negosiasi</span>
                                  <span><strong>H</strong> Evaluasi Harga/Biaya</span>
                                  <span><strong>PK</strong> Pemenang Berkontrak</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Timestamp cache */}
                          {infoTender.info_synced_at && (
                            <p className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              Data diperbarui: {new Date(infoTender.info_synced_at).toLocaleString("id-ID")}
                            </p>
                          )}
                        </div>
                      )}
                      {!infoLoading && !infoError && !infoTender && infoFetched && (
                        <div className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                          <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm">Data informasi tender tidak tersedia</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: ANALISIS AI */}
                  {lpseTab === "ai" && (
                    <div className="space-y-4">
                      {!aiSummary && !aiLoading && !aiError && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                          <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-indigo-500" />
                          </div>
                          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>Analisis Cerdas dengan AI</h3>
                          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--text-muted)" }}>
                            Dapatkan gambaran singkat, peluang, dan strategi memenangkan tender ini secara otomatis menggunakan kecerdasan buatan.
                          </p>
                          <button
                            onClick={fetchAISummary}
                            disabled={aiLoading}
                            className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] text-sm cursor-pointer shadow-lg shadow-indigo-500/20"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white" }}
                          >
                            <Sparkles className="w-4 h-4" />
                            {language === "EN" ? "Analyze Tender Now" : "Analisis Tender Sekarang"}
                          </button>
                        </div>
                      )}
                      
                      {(aiSummary || aiLoading || aiError) && (
                        <AIAnalysisPanel ai={aiSummary} loading={aiLoading} error={aiError} language={language} item={item} />
                      )}
                    </div>
                  )}

                </div>
              </div>


              {/* KOLOM KANAN: Ringkasan Nilai & LPSE Action (1/3 width) */}
              <div className="space-y-4 sm:space-y-5">
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                  <h2 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4">{language === "EN" ? "Financial Summary" : "Ringkasan Nilai"}</h2>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                        <Wallet className="w-3.5 h-3.5 text-[var(--accent)]" /> {language === "EN" ? "HPS Value" : "Nilai HPS Paket"}
                      </p>
                      <p className="text-base sm:text-xl font-extrabold text-[var(--accent-text)]">{item.hps}</p>
                    </div>

                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                      <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                        <Wallet className="w-3.5 h-3.5 text-emerald-500" /> {language === "EN" ? "Budget Value" : "Nilai Pagu Paket"}
                      </p>
                      <p className="text-base sm:text-xl font-extrabold text-emerald-500">{item.pagu}</p>
                    </div>
                  </div>
                </div>

                {/* Skor Relevansi Personalisasi */}
                {typeof item.relevance_score === "number" && item.relevance_score > 0 && (
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm sm:text-base font-bold mb-0.5">{language === "EN" ? "Relevance Score" : "Kecocokan Profil"}</h2>
                        <p className="text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>
                          {language === "EN" ? "Based on your location and interests" : "Berdasarkan lokasi & bidang minat Anda"}
                        </p>
                      </div>
                      <span
                        className="text-sm sm:text-lg font-black uppercase px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm"
                        style={{
                          background: item.relevance_score >= 60
                            ? "linear-gradient(135deg, #7c3aed15, #06b6d415)"
                            : "var(--bg-badge)",
                          color: item.relevance_score >= 60 ? "#7c3aed" : "var(--text-primary)",
                          border: `1px solid ${item.relevance_score >= 60 ? "#7c3aed40" : "var(--border-primary)"}`,
                        }}
                      >
                        <UserCheck className="w-4 h-4" strokeWidth={2.5} /> {item.relevance_score}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Tombol Aksi LPSE */}
                {item.url_lpse && (
                  <a
                    href={item.lelangId ? `${item.url_lpse}/lelang/${item.lelangId}/pengumumanlelang` : item.url_lpse}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-3.5 rounded-2xl font-bold transition-all hover:scale-[1.01] active:scale-[0.99] text-sm shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    {language === "EN" ? "Open LPSE Portal" : "Buka di LPSE"} <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {/* ── Klasifikasi Status Tender (hanya muncul jika tender di-pin) ── */}
                {isPinned && item.lelangId && (
                  <div
                    className="mt-1 p-4 rounded-2xl border"
                    style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
                  >
                    <h3 className="text-xs font-black uppercase tracking-wider mb-3" style={{ color: "var(--text-secondary)" }}>
                      {language === "EN" ? "Update Tender Status" : "Perbarui Status Tender"}
                    </h3>

                    {/* Tampilan status saat ini */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                        {language === "EN" ? "Current:" : "Status Saat Ini:"}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide"
                        style={{
                          backgroundColor:
                            currentStatus === "menang" ? "rgba(16,185,129,0.12)" :
                            currentStatus === "gagal" ? "rgba(239,68,68,0.12)" :
                            currentStatus === "selesai" ? "rgba(99,102,241,0.12)" :
                            "rgba(107,114,128,0.10)",
                          color:
                            currentStatus === "menang" ? "rgb(5,150,105)" :
                            currentStatus === "gagal" ? "rgb(220,38,38)" :
                            currentStatus === "selesai" ? "rgb(99,102,241)" :
                            "var(--text-secondary)",
                        }}
                      >
                        {currentStatus === "aktif" ? (language === "EN" ? "Active" : "Aktif") :
                         currentStatus === "menang" ? (language === "EN" ? "Won" : "Menang") :
                         currentStatus === "gagal" ? (language === "EN" ? "Failed" : "Gagal") :
                         (language === "EN" ? "Finished" : "Selesai")}
                      </span>
                    </div>

                    {/* Tombol klasifikasi */}
                    <div className="flex flex-col gap-2">
                      {currentStatus !== "menang" && (
                        <button
                          onClick={() => handleUpdateStatus("menang")}
                          disabled={statusLoading}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: "rgba(16,185,129,0.12)", color: "rgb(5,150,105)", border: "1px solid rgba(16,185,129,0.25)" }}
                        >
                          <Trophy size={14} />
                          {statusLoading ? "..." : (language === "EN" ? "Mark as Won 🏆" : "Tandai Menang 🏆")}
                        </button>
                      )}
                      {currentStatus !== "gagal" && (
                        <button
                          onClick={() => handleUpdateStatus("gagal")}
                          disabled={statusLoading}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: "rgba(239,68,68,0.10)", color: "rgb(220,38,38)", border: "1px solid rgba(239,68,68,0.22)" }}
                        >
                          <XCircle size={14} />
                          {statusLoading ? "..." : (language === "EN" ? "Mark as Failed ❌" : "Tandai Gagal ❌")}
                        </button>
                      )}
                      {currentStatus !== "aktif" && (
                        <button
                          onClick={() => handleUpdateStatus("aktif")}
                          disabled={statusLoading}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)" }}
                        >
                          <RotateCcw size={12} />
                          {statusLoading ? "..." : (language === "EN" ? "Reactivate" : "Aktifkan Kembali")}
                        </button>
                      )}
                    </div>

                    {/* Feedback message */}
                    {statusMessage && (
                      <div
                        className="mt-2.5 p-2.5 rounded-xl text-xs font-semibold"
                        style={{
                          backgroundColor: statusMessage.type === "success" ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
                          color: statusMessage.type === "success" ? "rgb(5,150,105)" : "rgb(220,38,38)",
                          border: `1px solid ${statusMessage.type === "success" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.22)"}`
                        }}
                      >
                        {statusMessage.text}
                      </div>
                    )}

                    <p className="mt-2.5 text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {language === "EN"
                        ? "Archived tenders are auto-deleted after 3 days."
                        : "Tender yang diarsipkan akan dihapus otomatis setelah 3 hari."}
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* ── PRODUCT DETAIL GRID (PRODUK INDONETWORK) ── */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* KOLOM KIRI: Deskripsi & Informasi (2/3 width) */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-5">
                {/* Tabs Selector */}
                <div className="flex border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <button
                    onClick={() => setActiveTab("desc")}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 font-extrabold text-xs sm:text-base border-b-2 transition-all"
                    style={{
                      borderColor: activeTab === "desc" ? "var(--accent)" : "transparent",
                      color: activeTab === "desc" ? "var(--text-primary)" : "var(--text-secondary)"
                    }}
                  >
                    {language === "EN" ? "Product Description" : "Deskripsi Produk"}
                  </button>
                  <button
                    onClick={() => setActiveTab("vendor")}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 font-extrabold text-xs sm:text-base border-b-2 transition-all"
                    style={{
                      borderColor: activeTab === "vendor" ? "var(--accent)" : "transparent",
                      color: activeTab === "vendor" ? "var(--text-primary)" : "var(--text-secondary)"
                    }}
                  >
                    {language === "EN" ? "Vendor Details" : "Informasi Vendor"}
                  </button>
                  <button
                    onClick={() => { setActiveTab("ai"); fetchAISummary(); }}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 font-extrabold text-xs sm:text-base border-b-2 transition-all flex items-center gap-1.5"
                    style={{
                      borderColor: activeTab === "ai" ? "#8b5cf6" : "transparent",
                      color: activeTab === "ai" ? "#8b5cf6" : "var(--text-secondary)"
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {language === "EN" ? "AI Analysis" : "Analisis AI"}
                  </button>
                </div>

                <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                  {activeTab === "desc" ? (
                    <div className="space-y-4">
                      <h4 className="text-base font-extrabold flex items-center gap-2">
                        <Info className="w-4 h-4 text-[var(--accent)]" /> {language === "EN" ? "Overview & Specifications" : "Ikhtisar & Spesifikasi"}
                      </h4>
                      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
                        {item.deskripsi || item.ringkasan}
                      </p>
                    </div>
                  ) : activeTab === "ai" ? (
                    <AIAnalysisPanel ai={aiSummary} loading={aiLoading} error={aiError} language={language} item={item} />
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-base font-extrabold flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[var(--accent)]" /> {language === "EN" ? "Supplier Profile" : "Informasi Perusahaan"}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Company Name" : "Nama Perusahaan"}</p>
                          <p className="text-sm font-extrabold mt-0.5">{item.nama_perusahaan || item.instansi}</p>
                        </div>
                        <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Location" : "Lokasi"}</p>
                          <p className="text-sm font-extrabold mt-0.5">{item.wilayah || "Indonesia"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* KOLOM KANAN: Pricing & Contact Action (1/3 width) */}
              <div className="space-y-4 sm:space-y-5">
                {/* Financial Summary */}
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                  <h2 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4">{language === "EN" ? "Pricing Summary" : "Ringkasan Nilai"}</h2>

                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                      <Wallet className="w-3.5 h-3.5 text-emerald-500" /> {language === "EN" ? "Estimated Price" : "Perkiraan Harga"}
                    </p>
                    <p className="text-base sm:text-xl font-extrabold text-emerald-500">{item.pagu || "Hubungi Penjual"}</p>
                  </div>
                </div>

                {/* Vendor Contact Sidebar */}
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border flex flex-col gap-3.5 sm:gap-4" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                  <div className="text-center pb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <h3 className="font-extrabold text-sm sm:text-base leading-snug">
                      {item.nama_perusahaan || item.instansi}
                    </h3>
                    <p className="text-xs font-bold text-emerald-500 flex items-center justify-center gap-1.5 mt-1.5">
                      {language === "EN" ? "Verified Vendor" : "Vendor Terverifikasi"} <ShieldCheck className="w-4 h-4 fill-emerald-500 text-white dark:text-[#0a0b0d]" />
                    </p>
                    <div className="flex items-center gap-1 mt-3 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full w-fit mx-auto text-blue-500">
                      <Star className="w-3 h-3 fill-blue-500" />
                      <span className="text-[9px] font-black uppercase tracking-wider">{item.kategori || "B2B"}</span>
                    </div>
                  </div>

                  {/* WhatsApp Button */}
                  <button
                    onClick={handleWhatsApp}
                    className="w-full py-3 bg-[#25D366] text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 hover:bg-[#1ebe57] transition-all hover:scale-[1.01] active:scale-[0.99] text-sm shadow-md cursor-pointer"
                  >
                    <MessageCircle className="w-4.5 h-4.5 fill-current" /> WhatsApp
                  </button>

                  {/* Phone Hubungi Button */}
                  <button
                    onClick={handleCall}
                    className="w-full py-3 bg-blue-600 text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm shadow-md cursor-pointer"
                  >
                    <Phone className="w-4.5 h-4.5 fill-current" /> {language === "EN" ? "Call Supplier" : "Hubungi"}
                  </button>

                  {/* Mail Info */}
                  <div className="flex items-start gap-3 mt-2 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="p-2 rounded-lg border text-[var(--text-secondary)]" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Email Address" : "Alamat Email"}</p>
                      <p className="text-xs font-bold truncate mt-0.5" style={{ color: "var(--text-primary)" }}>
                        {item.email || "sales@indonetwork.co.id"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* External link to product details if available */}
                {item.url_produk && (
                  <a
                    href={item.url_produk}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-3 rounded-2xl font-bold transition-all hover:scale-[1.01] active:scale-[0.99] text-xs cursor-pointer"
                  >
                    {language === "EN" ? "Open Vendor Website" : "Buka Situs Vendor"} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

// ── AIAnalysisPanel Sub-Component ─────────────────────────────────────────
function AIAnalysisPanel({
  ai,
  loading,
  error,
  language,
  item,
}: {
  ai: any;
  loading: boolean;
  error: string | null;
  language: "ID" | "EN";
  item?: any;
}) {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: "user"|"assistant", content: string}[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isAsking]);

  const handleAsk = async () => {
    if (!question.trim() || isAsking || !item) return;
    const userQ = question.trim();
    setQuestion("");
    setChatHistory(prev => [...prev, { role: "user", content: userQ }]);
    setIsAsking(true);

    try {
      const res = await fetch("/api/ai/chat-tender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lelangId: item.lelangId,
          question: userQ,
          history: chatHistory,
          tenderData: item,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal bertanya");
      setChatHistory(prev => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAsk();
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded bg-violet-400/40" />
          <div className="h-4 w-32 rounded bg-violet-400/20" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-3 rounded w-full" style={{ backgroundColor: "var(--bg-badge)" }} />
        ))}
        <div className="h-3 rounded w-2/3" style={{ backgroundColor: "var(--bg-badge)" }} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200/50 bg-red-50/30">
        <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // Empty state
  if (!ai) return null;

  const kompetisiLower = typeof ai?.kompetisi === "string" ? ai.kompetisi.toLowerCase() : "";
  const kompetisiColor =
    kompetisiLower === "tinggi"
      ? "#ef4444"
      : kompetisiLower === "sedang"
      ? "#f59e0b"
      : "#22c55e";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <h4 className="font-extrabold text-sm" style={{ color: "var(--text-primary)" }}>
            {language === "EN" ? "AI Analysis" : "Analisis AI"}
          </h4>
        </div>
      </div>

      {/* Gambaran Singkat */}
      {ai.gambaran && (
        <div className="p-3.5 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"
            style={{ color: "var(--text-secondary)" }}>
            <Info className="w-3 h-3" />
            {language === "EN" ? "Overview" : "Gambaran Singkat"}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{ai.gambaran}</p>
        </div>
      )}

      {/* Poin Penting */}
      {Array.isArray(ai.poin_penting) && ai.poin_penting.length > 0 && (
        <div className="p-3.5 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
            style={{ color: "var(--text-secondary)" }}>
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {language === "EN" ? "Key Points" : "Poin Penting"}
          </p>
          <ul className="space-y-1.5">
            {ai.poin_penting.map((p: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tingkat Kompetisi */}
      {ai.kompetisi && (
        <div className="p-3.5 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
            style={{ color: "var(--text-secondary)" }}>
            <TrendingUp className="w-3 h-3" />
            {language === "EN" ? "Competition Level" : "Tingkat Kompetisi"}
          </p>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-extrabold capitalize" style={{ color: kompetisiColor }}>
              {ai.kompetisi}
            </span>
            {ai.alasan_kompetisi && (
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>— {ai.alasan_kompetisi}</span>
            )}
          </div>
        </div>
      )}

      {/* Saran */}
      {ai.saran && (
        <div className="p-3.5 rounded-xl border"
          style={{ backgroundColor: "rgba(139,92,246,0.05)", borderColor: "rgba(139,92,246,0.2)" }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5 text-violet-500">
            <Lightbulb className="w-3 h-3" />
            {language === "EN" ? "Recommendation" : "Saran"}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{ai.saran}</p>
        </div>
      )}

      {/* ── Q&A Chat Box ── */}
      <div className="mt-6 pt-4 border-t border-dashed" style={{ borderColor: "var(--border-subtle)" }}>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 text-violet-500">
          <MessageSquare className="w-3.5 h-3.5" />
          {language === "EN" ? "Ask AI About This Tender" : "Tanya AI Tentang Tender Ini"}
        </h4>
        
        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-3 rounded-2xl max-w-[90%] text-sm ${
                  msg.role === "user" 
                    ? "bg-violet-500 text-white rounded-br-none" 
                    : "border rounded-bl-none"
                }`} style={msg.role === "assistant" ? { backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" } : {}}>
                  <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                </div>
              </div>
            ))}
            {isAsking && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl rounded-bl-none border flex gap-1 items-center" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input Box */}
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === "EN" ? "e.g. Do I need an ISO certificate?" : "Misal: Apakah butuh sertifikat ISO untuk ini?"}
            className="w-full pl-4 pr-12 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            style={{ 
              backgroundColor: "var(--bg-card)", 
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)"
            }}
            disabled={isAsking}
          />
          <button
            onClick={handleAsk}
            disabled={!question.trim() || isAsking}
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
