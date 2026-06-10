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
  UserCheck,
  RefreshCw,
  Loader2,
  Trash2,
  Edit2,
  CornerDownRight,
  ThumbsUp,
  BrainCircuit,
  Bookmark,
  BookmarkCheck,
  Bell
} from "lucide-react";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SearchResultItem } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";
import { toast } from "react-hot-toast";

type DetailModalProps = {
  item: SearchResultItem;
  onClose: () => void;
  language: "ID" | "EN";
  isPinned?: boolean;
  userId?: string | number | null;
  userName?: string | null;
  userAvatar?: string | null;
  onTogglePin?: (item: SearchResultItem) => void;
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

const DEFAULT_JADWAL = [
  { tahap: "Pengumuman Prakualifikasi", mulai: "23 April 2026 13:00", sampai: "30 April 2026 10:00", perubahan: "Tidak Ada" },
  { tahap: "Download Dokumen Kualifikasi", mulai: "23 April 2026 13:00", sampai: "30 April 2026 10:00", perubahan: "Tidak Ada" },
  { tahap: "Pemberian Penjelasan", mulai: "27 April 2026 09:30", sampai: "27 April 2026 12:00", perubahan: "Tidak Ada" },
  { tahap: "Upload Dokumen Kualifikasi", mulai: "27 April 2026 12:05", sampai: "30 April 2026 10:00", perubahan: "1 kali perubahan" },
  { tahap: "Evaluasi Kualifikasi", mulai: "30 April 2026 10:01", sampai: "8 Mei 2026 14:00", perubahan: "1 kali perubahan" },
  { tahap: "Penandatanganan Kontrak", mulai: "21 Mei 2026 14:01", sampai: "10 Juli 2026 10:00", perubahan: "Belum Mulai" }
];

/* ═══════════════════════════════════════════════════════════
   KOMPONEN: Analisis Strategi Lelang oleh AI
   ═══════════════════════════════════════════════════════════ */
const LEVEL_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "Tinggi":  { bg: "rgba(239,68,68,0.08)",  text: "#dc2626", dot: "#ef4444" },
  "Sedang":  { bg: "rgba(245,158,11,0.08)", text: "#d97706", dot: "#f59e0b" },
  "Rendah":  { bg: "rgba(16,185,129,0.08)", text: "#059669", dot: "#10b981" },
};

function AiBiddingAnalysis({ namaPaket, pagu, hps, pemenangNama, pemenangHarga, peserta }: {
  namaPaket: string;
  pagu: string;
  hps: string;
  pemenangNama: string;
  pemenangHarga: string;
  peserta: { nama: string; fullNama: string; harga: number; isWinner: boolean }[];
}) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const handleAnalyze = async () => {
    if (fetched || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/analyze-bidding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_paket: namaPaket,
          pagu,
          hps,
          pemenang_nama: pemenangNama,
          pemenang_harga: pemenangHarga,
          peserta: peserta.map(p => ({ nama: p.fullNama, harga: p.harga, isWinner: p.isWinner })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menganalisis");
      setAnalysis(json.analysis);
      setFetched(true);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleAnalyze();
  }, []); // Auto-fetch on mount

  const levelColor = LEVEL_COLORS[analysis?.level_kompetisi] || LEVEL_COLORS["Sedang"];

  return (
    <div className="mt-4 rounded-xl border overflow-hidden" style={{ borderColor: "rgba(139,92,246,0.2)", backgroundColor: "rgba(139,92,246,0.03)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(139,92,246,0.15)" }}>
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4" style={{ color: "#8b5cf6" }} />
          <span className="text-xs font-bold" style={{ color: "#7c3aed" }}>Analisis Strategi Lelang</span>
        </div>
        {!fetched && loading && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
            Menganalisis pola harga...
          </div>
        )}
        {fetched && (
          <button
            onClick={() => { setFetched(false); setAnalysis(null); handleAnalyze(); }}
            className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        )}
      </div>

      {/* State: loading */}
      {loading && !analysis && (
        <div className="p-4 space-y-3 animate-pulse">
          <div className="h-4 bg-slate-200/60 rounded-md w-1/4"></div>
          <div className="h-20 bg-slate-100 rounded-lg"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="h-24 bg-slate-100 rounded-lg"></div>
            <div className="h-24 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      )}

      {/* State: error */}
      {error && (
        <div className="px-4 py-4 text-center">
          <p className="text-xs text-red-500">{error}</p>
          <button onClick={() => { setError(null); handleAnalyze(); }} className="mt-2 text-[10px] text-purple-500 underline">Coba lagi</button>
        </div>
      )}

      {/* State: result */}
      {analysis && (
        <div className="p-4 space-y-3">

          {/* Level kompetisi badge */}
          {analysis.level_kompetisi && (
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 shrink-0">Level Kompetisi:</span>
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide shrink-0"
                style={{ backgroundColor: levelColor.bg, color: levelColor.text }}
              >
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: levelColor.dot }} />
                {analysis.level_kompetisi}
              </span>
              {analysis.alasan_level && (
                <span className="text-[10px] text-slate-500 italic leading-relaxed">{analysis.alasan_level}</span>
              )}
            </div>
          )}

          {/* Ringkasan */}
          {analysis.ringkasan && (
            <div className="bg-white rounded-lg p-3 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">📋 Ringkasan</p>
              <p className="text-xs text-slate-700 leading-relaxed">{analysis.ringkasan}</p>
            </div>
          )}

          {/* Grid 2 kartu: Persaingan & Strategi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analysis.analisis_selisih && (
              <div className="bg-white rounded-lg p-3 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">📊 Dinamika Harga Peserta</p>
                <p className="text-xs text-slate-700 leading-relaxed">{analysis.analisis_selisih}</p>
              </div>
            )}
            {analysis.strategi_pemenang && (
              <div className="bg-white rounded-lg p-3 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">🏅 Strategi Pemenang</p>
                <p className="text-xs text-slate-700 leading-relaxed">{analysis.strategi_pemenang}</p>
              </div>
            )}
          </div>

          {/* Asumsi Metode Evaluasi */}
          {analysis.asumsi_metode && (
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Asumsi Metode Evaluasi</p>
                <p className="text-xs text-slate-600 leading-relaxed italic">{analysis.asumsi_metode}</p>
              </div>
            </div>
          )}

          {/* Pelajaran — split by " | " jadi bullet points */}
          {analysis.pelajaran && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pelajaran Spesifik dari Lelang Ini</p>
              </div>
              <ul className="space-y-1.5">
                {(Array.isArray(analysis.pelajaran) ? analysis.pelajaran : String(analysis.pelajaran).split("|")).map((point: string, i: number) => (
                  point.trim() && (
                    <li key={i} className="flex gap-2 text-xs text-slate-700 leading-relaxed">
                      <span className="font-black text-amber-500 shrink-0">{i + 1}.</span>
                      <span>{point.trim()}</span>
                    </li>
                  )
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
}


const ReviewSection = ({ itemId, itemType, userId, userName, userAvatar, language }: { itemId: string, itemType: string, userId: string | number | null | undefined, userName?: string | null, userAvatar?: string | null, language: "ID" | "EN" }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "", userName: userName || "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States for Edit & Reply
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReview, setEditReview] = useState({ rating: 5, comment: "" });
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyUserName, setReplyUserName] = useState(userName || "");

  useEffect(() => {
    fetchReviews();
  }, [itemId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/reviews?itemId=${itemId}`);
      const data = await res.json();
      if (data.reviews) setReviews(data.reviews);
    } catch (e) {
      console.error("Failed to fetch reviews", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const targetUserName = parentId ? replyUserName : newReview.userName;
    const targetComment = parentId ? replyText : newReview.comment;
    
    if (!targetUserName || !targetComment) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          itemType,
          userId: userId || null,
          userName: targetUserName,
          userAvatar: userAvatar || null,
          rating: parentId ? undefined : newReview.rating,
          comment: targetComment,
          parentId
        })
      });
      if (res.ok) {
        if (parentId) {
          setReplyingTo(null);
          setReplyText("");
        } else {
          setNewReview({ rating: 5, comment: "", userName: userName || "" });
        }
        fetchReviews();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === "EN" ? "Delete this review?" : "Hapus ulasan ini?")) return;
    try {
      const params = new URLSearchParams();
      params.append("_id", id);
      if (userId) params.append("userId", String(userId));
      if (userName) params.append("userName", userName);
      
      const res = await fetch(`/api/reviews?${params.toString()}`, { method: 'DELETE' });
      if (res.ok) {
        fetchReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editReview.comment) return;
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: id,
          rating: editReview.rating,
          comment: editReview.comment,
          userId: userId || null,
          userName: userName || null
        })
      });
      if (res.ok) {
        setEditingId(null);
        fetchReviews();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async (id: string) => {
    const likeUserId = String(userId || userName || "");
    if (!likeUserId) {
      toast.error(language === "EN" ? "Please log in or enter your name to like." : "Silakan login atau masukkan nama Anda untuk menyukai.");
      return;
    }

    // Optimistic update: update UI immediately without re-fetching
    setReviews(prev => prev.map(r => {
      if (r._id !== id) return r;
      const likes: string[] = r.likes || [];
      const alreadyLiked = likes.includes(likeUserId);
      return {
        ...r,
        likes: alreadyLiked
          ? likes.filter((uid: string) => uid !== likeUserId)
          : [...likes, likeUserId]
      };
    }));

    try {
      await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: id, userId: likeUserId })
      });
    } catch (e) {
      // Revert on failure
      console.error(e);
      fetchReviews();
    }
  };

  const checkOwnership = (rev: any) => {
    if (userId && rev.userId === String(userId)) return true;
    if (!rev.userId && userName && rev.userName === userName) return true;
    return false;
  };

  // Grouping replies
  const topLevelReviews = reviews.filter(r => !r.parentId);
  const getReplies = (parentId: string) => reviews.filter(r => r.parentId === parentId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const renderReview = (rev: any, isReply: boolean = false) => {
    const isOwner = checkOwnership(rev);
    const isEditing = editingId === rev._id;
    const isDeleted = rev.isDeleted;

    return (
      <div key={rev._id} className={`py-4 flex flex-col gap-2.5 ${!isReply ? "border-b border-slate-100" : "mt-2 pt-2 border-t border-slate-50"}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5">
            {(rev.userAvatar || (rev.userId === userId && userAvatar)) && !(rev.userAvatar || (rev.userId === userId && userAvatar))?.includes("default-avatar") && !isDeleted ? (
              <img src={rev.userAvatar || userAvatar || ""} alt={rev.userName} className={`rounded-full object-cover border border-slate-200 ${isReply ? "w-6 h-6" : "w-8 h-8"}`} />
            ) : (
              <div className={`${isReply ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-[11px]"} rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-500`}>
                {isDeleted ? "-" : rev.userName.charAt(0)}
              </div>
            )}
            <div>
              <p className={`font-bold ${isReply ? "text-[11px]" : "text-xs"} text-slate-800`}>
                {isDeleted ? (language === "EN" ? "[Deleted User]" : "[Pengguna Dihapus]") : rev.userName}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {new Date(rev.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                {rev.createdAt !== rev.updatedAt && !isDeleted && (language === "EN" ? " (Edited)" : " (Diedit)")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOwner && !isEditing && !isDeleted && (
              <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingId(rev._id); setEditReview({ rating: rev.rating || 5, comment: rev.comment }); }} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(rev._id)} className="p-1 hover:bg-slate-50 rounded text-red-500" title="Hapus">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {!isEditing && !isReply && !isDeleted && (
              <div className="flex items-center gap-0.5 bg-slate-50 px-2 py-1 rounded-md ml-1">
                <span className="text-[10px] font-bold text-amber-600 mr-1">{rev.rating}.0</span>
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={(e) => handleUpdate(e, rev._id)} className="mt-2 flex flex-col gap-3">
            {!isReply && (
              <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditReview({ ...editReview, rating: star })}
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star className={`w-3.5 h-3.5 ${star <= editReview.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={editReview.comment}
              onChange={e => setEditReview({ ...editReview, comment: e.target.value })}
              required
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-lg border border-slate-200 focus:border-slate-300 text-xs focus:outline-none transition-colors resize-none"
            />
            <div className="flex gap-2 self-end">
              <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                {language === "EN" ? "Cancel" : "Batal"}
              </button>
              <button type="submit" disabled={!editReview.comment} className="px-3 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors">
                {language === "EN" ? "Save" : "Simpan"}
              </button>
            </div>
          </form>
        ) : (
          <div className="pl-9">
            <p className={`text-xs ${isDeleted ? "text-slate-400 italic" : "text-slate-600"} leading-relaxed`}>
              {isDeleted ? (language === "EN" ? "This review has been deleted." : "Ulasan ini telah dihapus.") : rev.comment}
            </p>
            {!isDeleted && (
              <div className="mt-2 flex items-center gap-4">
                <motion.button 
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleLike(rev._id)}
                  className={`text-[10px] font-bold flex items-center gap-1.5 transition-colors ${rev.likes?.includes(String(userId || userName)) ? "text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  <motion.div
                    initial={false}
                    animate={rev.likes?.includes(String(userId || userName)) ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <ThumbsUp className={`w-3 h-3 ${rev.likes?.includes(String(userId || userName)) ? "fill-blue-600" : ""}`} />
                  </motion.div>
                  {rev.likes?.length || 0}
                </motion.button>
                
                {/* Reply Button (Only on top-level) */}
                {!isReply && (
                  <button 
                    onClick={() => setReplyingTo(replyingTo === rev._id ? null : rev._id)}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                  >
                    <CornerDownRight className="w-3 h-3" />
                    {language === "EN" ? "Reply" : "Balas"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reply Form */}
        {replyingTo === rev._id && !isReply && (
          <form onSubmit={(e) => handleSubmit(e, rev._id)} className="mt-3 ml-9 pl-3 border-l-2 border-slate-200 flex flex-col gap-2">
            {!userName && (
              <input
                type="text"
                placeholder={language === "EN" ? "Your Name" : "Nama Anda"}
                value={replyUserName}
                onChange={e => setReplyUserName(e.target.value)}
                required
                className="w-full sm:max-w-[200px] px-3 py-1.5 bg-slate-50/50 hover:bg-slate-100 focus:bg-white rounded border border-transparent focus:border-slate-200 text-[11px] focus:outline-none transition-colors"
              />
            )}
            <div className="relative">
              <textarea
                placeholder={language === "EN" ? "Write a reply..." : "Tulis balasan..."}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                required
                rows={2}
                className="w-full px-3 py-2 bg-slate-50/50 hover:bg-slate-100 focus:bg-white rounded-lg border border-transparent focus:border-slate-200 text-xs focus:outline-none transition-colors resize-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isSubmitting || !replyText || (!userName && !replyUserName)}
                className="absolute bottom-2 right-2 p-1.5 bg-slate-800 text-white rounded flex items-center justify-center hover:bg-slate-900 disabled:opacity-40 disabled:hover:bg-slate-800 transition-all"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              </button>
            </div>
          </form>
        )}

        {/* Render Replies */}
        {!isReply && getReplies(rev._id).length > 0 && (
          <div className="mt-3 ml-9 pl-4 border-l-2 border-slate-100 flex flex-col gap-0">
            {getReplies(rev._id).map(reply => renderReview(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 mt-8 pt-8 border-t border-slate-200">
      {/* Form Tambah Ulasan */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-500" />
          {language === "EN" ? "Leave a Review" : "Tulis Ulasan"}
        </h3>
        
        <form onSubmit={(e) => handleSubmit(e, null)} className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {userName ? (
              <div className="flex items-center gap-2">
                {userAvatar && !userAvatar.includes("default-avatar") ? (
                  <img src={userAvatar} alt={userName} className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-500 text-[9px]">
                    {userName.charAt(0)}
                  </div>
                )}
                <span className="text-xs text-slate-500 font-medium">
                  {language === "EN" ? "Posting as" : "Mengulas sebagai"} <span className="text-slate-800 font-bold">{userName}</span>
                </span>
              </div>
            ) : (
              <input
                type="text"
                placeholder={language === "EN" ? "Your Name" : "Nama Anda"}
                value={newReview.userName}
                onChange={e => setNewReview({ ...newReview, userName: e.target.value })}
                required
                className="w-full sm:max-w-[200px] px-3 py-2 bg-slate-50/50 hover:bg-slate-100 focus:bg-white rounded-lg border border-transparent focus:border-slate-200 text-xs focus:outline-none transition-colors"
              />
            )}
            
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                >
                  <Star className={`w-4 h-4 ${star <= newReview.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}`} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <textarea
              placeholder={language === "EN" ? "Share your experience..." : "Bagikan pengalaman Anda..."}
              value={newReview.comment}
              onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-slate-200 text-sm focus:outline-none transition-colors resize-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newReview.userName || !newReview.comment}
              className="absolute bottom-3 right-3 p-2 bg-slate-800 text-white rounded-lg flex items-center justify-center hover:bg-slate-900 disabled:opacity-40 disabled:hover:bg-slate-800 transition-all active:scale-95"
              title={language === "EN" ? "Submit" : "Kirim"}
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      </div>

      {/* Daftar Ulasan */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            {language === "EN" ? "Reviews" : "Ulasan"} <span className="text-slate-400 font-normal ml-1">({topLevelReviews.length})</span>
          </h3>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat ulasan...
          </div>
        ) : topLevelReviews.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            {language === "EN" ? "No reviews yet. Be the first to share your thoughts!" : "Belum ada ulasan. Bagikan pengalaman Anda pertama kali!"}
          </div>
        ) : (
          <div className="flex flex-col max-h-[500px] overflow-y-auto custom-scrollbar pr-2 gap-0">
            {topLevelReviews.map((rev) => renderReview(rev))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function DetailModal({ item, onClose, language, isPinned = false, userId, userName, userAvatar, onTogglePin, onStatusUpdate }: DetailModalProps) {
  const [activeTab, setActiveTab] = useState<"desc" | "vendor" | "ai" | "ulasan">("desc");
  // Tab khusus untuk tender LPSE (Jasa)
  const isSelesai = item.status && (item.status.toLowerCase().includes("selesai") || item.status.toLowerCase().includes("menang"));
  const [lpseTab, setLpseTab] = useState<"jadwal" | "info" | "peserta" | "ai" | "ulasan">(isSelesai ? "info" : "jadwal");
  const isLpse = !!item.lelangId || !!item.url_lpse || item.tipe === "Jasa" || item.kategori === "Jasa";

  // ── Real-time clock state untuk warna titik ────────────────────────────
  // Di-update setiap 60 detik agar titik hijau/biru berubah otomatis
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // ── Jadwal state: mulai dari data DB, lalu di-sync dari LPSE ─────────
  const initialJadwal = isLpse && item.jadwal && item.jadwal.length > 0 ? item.jadwal : DEFAULT_JADWAL;
  const [jadwalList, setJadwalList] = useState<any[]>(initialJadwal);
  const [jadwalSource, setJadwalSource] = useState<"database" | "lpse" | "loading">("loading");

  useEffect(() => {
    if (!isLpse || !item.lelangId || !item.url_lpse) {
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
  }, [isLpse, item.lelangId, item.url_lpse]);

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

  useEffect(() => {
    if (isLpse && (lpseTab === "info" || lpseTab === "peserta")) {
      fetchInfoTender();
    }
  }, [lpseTab, isLpse, item.lelangId]);

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
      // Jika JSON parse gagal (misal terpotong karena limit token), kita ekstrak manual dengan regex
      const partial: any = {};
      
      const extractString = (key: string) => {
        const match = cleanText.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, 'i'));
        return match ? match[1] : null;
      };

      partial.gambaran = extractString("gambaran");
      partial.kompetisi = extractString("kompetisi");
      partial.alasan_kompetisi = extractString("alasan_kompetisi");
      partial.saran = extractString("saran");

      // Ekstrak array poin_penting
      const poinMatch = cleanText.match(/"poin_penting"\s*:\s*\[([\s\S]*?)\]/i) || cleanText.match(/"poin_penting"\s*:\s*\[([\s\S]*)/i);
      if (poinMatch) {
        const arrStr = poinMatch[1];
        const items = [...arrStr.matchAll(/"([^"]+)"/g)].map(m => m[1]);
        if (items.length > 0) {
          partial.poin_penting = items;
        }
      }

      // Jika sama sekali gagal ekstrak format JSON, tampilkan teks kotor yang dibersihkan
      if (!partial.gambaran && !partial.poin_penting) {
        return { gambaran: cleanText.replace(/[{}[\]"]/g, "").trim() };
      }

      return partial;
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
        const partial: any = {};
        const extractString = (key: string) => {
          const match = cleanText.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, 'i'));
          return match ? match[1] : null;
        };

        partial.gambaran = extractString("gambaran");
        partial.kompetisi = extractString("kompetisi");
        partial.alasan_kompetisi = extractString("alasan_kompetisi");
        partial.saran = extractString("saran");

        const poinMatch = cleanText.match(/"poin_penting"\s*:\s*\[([\s\S]*?)\]/i) || cleanText.match(/"poin_penting"\s*:\s*\[([\s\S]*)/i);
        if (poinMatch) {
          const arrStr = poinMatch[1];
          const items = [...arrStr.matchAll(/"([^"]+)"/g)].map(m => m[1]);
          if (items.length > 0) partial.poin_penting = items;
        }

        if (!partial.gambaran && !partial.poin_penting) {
          setAiSummary({ gambaran: (cleanText || data.summary).replace(/[{}[\]"]/g, "").trim() });
        } else {
          setAiSummary(partial);
        }
      }
    } catch (err: any) {
      setAiError(err.message || "Gagal memuat analisis AI");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (lpseTab === "ai") {
      fetchAISummary();
    }
  }, [lpseTab]);

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
        className="relative z-10 w-[94%] sm:w-full max-w-5xl h-auto max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-xl sm:rounded-xl border shadow-2xl overflow-hidden focus:outline-none transition-colors duration-200"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-primary)",
          color: "var(--text-primary)"
        }}
      >
        {/* ── HEADER ACTIONS (PIN & CLOSE) ── */}
        <div className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 flex items-center gap-2 z-20">
          {onTogglePin && (
            <div className="flex items-center gap-2">
              {/* Badge Status Pelacakan */}
              <span 
                className={`hidden sm:flex items-center gap-1.5 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full transition-colors duration-300 ${
                  isPinned 
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                    : "bg-slate-100 text-slate-500 border border-slate-200"
                }`}
              >
                {isPinned ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {language === "EN" ? "Tracking Active" : "Pelacakan Aktif"}
                  </>
                ) : (
                  language === "EN" ? "Save to track" : "Simpan & Lacak"
                )}
              </span>
              
              {/* Tombol Simpan/Lacak */}
              <button
                onClick={() => onTogglePin(item)}
                className="p-2 sm:p-2.5 rounded-full border hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center shadow-sm"
                style={
                  isPinned
                    ? { backgroundColor: "#10b981", borderColor: "#059669", color: "#ffffff", boxShadow: "0 0 10px rgba(16, 185, 129, 0.4)" }
                    : { backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }
                }
                title={isPinned ? (language === "EN" ? "Tracking" : "Sedang Dilacak") : (language === "EN" ? "Track Schedule" : "Lacak Jadwal")}
              >
                {isPinned ? <BookmarkCheck className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full border hover:scale-105 active:scale-95 transition-all duration-200 hover:opacity-80 flex items-center justify-center"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              borderColor: "var(--border-primary)",
              color: "var(--text-secondary)"
            }}
            title={language === "EN" ? "Close" : "Tutup"}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

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
                {(() => {
                  const textToCheck = `${item.nama_produk} ${item.status} ${infoTender?.tahap_saat_ini || item.tahap_saat_ini}`.toLowerCase();
                  const isUlang = textToCheck.includes("seleksi ulang") || textToCheck.includes("tender ulang") || textToCheck.includes("diulang");
                  const isGagal = textToCheck.includes("tender gagal") || textToCheck.includes("gagal");
                  if (isUlang || isGagal) {
                    return (
                      <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 border ${isUlang ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isUlang ? 'bg-orange-500' : 'bg-red-500'} animate-pulse`}></span>
                        {isUlang ? "Diulang" : "Gagal"}
                      </span>
                    );
                  }
                  return null;
                })()}
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
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>{item.wilayah}</span>
                  </div>
                )}
                {isLpse && item.metode_pengadaan && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Tag className="w-4 h-4 text-slate-500" />
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

          {/* ── INFO PELACAKAN JADWAL (Hanya Tampil Jika Disimpan & Adalah Tender LPSE) ── */}
          {isPinned && isLpse && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: "auto" }} 
              className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border overflow-hidden" 
              style={{ backgroundColor: "rgba(99, 102, 241, 0.05)", borderColor: "rgba(99, 102, 241, 0.2)" }}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold mb-1 text-indigo-900">
                  {language === "EN" ? "Schedule Tracking is Active" : "Pelacakan Jadwal Aktif"}
                </p>
                <p className="text-xs leading-relaxed text-indigo-800 opacity-90 max-w-3xl">
                  {language === "EN" 
                    ? "You have saved this tender. The system is actively monitoring it and will automatically send a notification when the schedule or stage is updated by the organizer." 
                    : "Anda telah menyimpan tender ini. Sistem sedang aktif memantaunya dan akan otomatis mengirimkan notifikasi kepada Anda setiap kali ada pembaruan jadwal atau tahapan dari pihak penyelenggara."}
                </p>
              </div>
            </motion.div>
          )}

          {/* ========================================================
              MAIN CONTENT (2 Column Grid Layout)
              ======================================================== */}
          {isLpse ? (
            /* ── TENDER DETAIL GRID (LPSE JASA) ── */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
              
              {/* KOLOM KIRI: Tab Navigasi (2/3 width) */}
              <div className="lg:col-span-2 rounded-xl sm:rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>

                {/* ── Tab Bar ── */}
                <div className="flex overflow-x-auto border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <button
                    onClick={() => setLpseTab("jadwal")}
                    className="flex items-center gap-1.5 px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap shrink-0"
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
                    className="flex items-center gap-1.5 px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap shrink-0"
                    style={{
                      borderColor: lpseTab === "info" ? "var(--accent)" : "transparent",
                      color: lpseTab === "info" ? "var(--text-primary)" : "var(--text-secondary)"
                    }}
                  >
                    <Info className="w-3.5 h-3.5" />
                    {language === "EN" ? "Tender Info" : "Informasi Tender"}
                  </button>
                  <button
                    onClick={() => { setLpseTab("peserta"); fetchInfoTender(); }}
                    className="flex items-center gap-1.5 px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap shrink-0"
                    style={{
                      borderColor: lpseTab === "peserta" ? "var(--accent)" : "transparent",
                      color: lpseTab === "peserta" ? "var(--text-primary)" : "var(--text-secondary)"
                    }}
                  >
                    <Users className="w-3.5 h-3.5" />
                    {language === "EN" ? "Participants" : "Peserta"}
                  </button>
                  <button
                    onClick={() => { setLpseTab("ai"); fetchInfoTender(); }}
                    className="flex items-center gap-1.5 px-4 sm:px-5 py-3 font-bold text-xs sm:text-sm border-b-2 transition-all whitespace-nowrap shrink-0"
                    style={{
                      borderColor: lpseTab === "ai" ? "#10b981" : "transparent",
                      color: lpseTab === "ai" ? "#059669" : "var(--text-secondary)"
                    }}
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    {language === "EN" ? "Bid Analysis" : "Analisa Harga Penawaran"}
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
                      </div>

                      {(() => {
                        // Kalkulasi Statistik Proses
                        const parsePagu = (paguStr: string) => {
                          if (!paguStr) return 0;
                          const numStr = paguStr.replace(/Rp\.?|[^0-9,-]/g, "").replace(/,/g, ".");
                          const num = parseFloat(numStr);
                          return isNaN(num) ? 0 : num;
                        };
                        const formatRupiah = (val: number) => {
                          return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
                        };

                        const parseJadwalDate = (dateStr: string) => {
                          if (!dateStr || dateStr === "-") return null;
                          const monthMap: Record<string, string> = {
                            Januari: "01", Februari: "02", Maret: "03", April: "04",
                            Mei: "05", Juni: "06", Juli: "07", Agustus: "08",
                            September: "09", Oktober: "10", November: "11", Desember: "12"
                          };
                          const match = dateStr.trim().match(/^(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+(\d{2}:\d{2}))?/);
                          if (match) {
                            const [, day, monthName, year, time] = match;
                            const month = monthMap[monthName] || "01";
                            const timeStr = time || "23:59";
                            const parsed = new Date(`${year}-${month}-${day.padStart(2, "0")}T${timeStr}:00+07:00`);
                            return isNaN(parsed.getTime()) ? null : parsed;
                          }
                          const fallback = new Date(dateStr);
                          return isNaN(fallback.getTime()) ? null : fallback;
                        };

                        let durasi_hari = 0;
                        let jumlah_reschedule = 0;
                        let bottleneckTahap = "-";
                        let maxDurasiTahap = 0;

                        if (jadwalList.length > 0) {
                          jumlah_reschedule = jadwalList.filter((j: any) => j.perubahan && j.perubahan.trim() !== "" && j.perubahan.trim().toLowerCase() !== "tidak ada").length;
                          
                          const dates = jadwalList.flatMap((j: any) => [parseJadwalDate(j.mulai), parseJadwalDate(j.sampai)]).filter((d: any) => d !== null) as Date[];
                          if (dates.length > 0) {
                            const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                            const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                            durasi_hari = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
                          }

                          // Cari bottleneck
                          jadwalList.forEach((j: any) => {
                            const m = parseJadwalDate(j.mulai);
                            const s = parseJadwalDate(j.sampai);
                            if (m && s) {
                              const d = Math.ceil((s.getTime() - m.getTime()) / (1000 * 60 * 60 * 24));
                              if (d > maxDurasiTahap) {
                                maxDurasiTahap = d;
                                bottleneckTahap = j.tahap || "-";
                              }
                            }
                          });
                        }

                        return (
                          <div className="mb-6">
                            {(durasi_hari > 0 && durasi_hari < 14 || jumlah_reschedule > 3) && (
                              <div className="mb-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-red-700 flex gap-3 shadow-sm">
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                                <div>
                                  <p className="font-bold text-sm mb-1">⚠️ Peringatan: Terdeteksi Anomali Jadwal</p>
                                  <p className="text-xs leading-relaxed opacity-90">
                                    Tender ini memiliki {durasi_hari > 0 && durasi_hari < 14 ? "durasi yang sangat singkat (kurang dari 14 hari)" : "frekuensi perubahan jadwal yang tidak wajar (>3 kali)"}. Berhati-hatilah karena terdapat risiko tinggi proses tender telah diarahkan atau kurang transparan.
                                  </p>
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="p-3.5 rounded-xl border bg-slate-50/50 border-slate-200">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Total Durasi</p>
                                <p className="text-xl font-black text-slate-700">{durasi_hari > 0 ? `${durasi_hari} Hari` : "-"}</p>
                              </div>
                              <div className={`p-3.5 rounded-xl border ${jumlah_reschedule > 0 ? 'bg-slate-50/50 border-slate-200' : 'bg-slate-50/50 border-slate-200'}`}>
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${jumlah_reschedule > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
                                  <RefreshCw className="w-3.5 h-3.5" /> Perubahan Jadwal
                                </p>
                                <p className={`text-xl font-black ${jumlah_reschedule > 0 ? 'text-amber-700' : 'text-slate-700'}`}>{jumlah_reschedule} Kali</p>
                              </div>
                              <div className="p-3.5 rounded-xl border bg-slate-50/50 border-slate-200">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Tahap Terlama</p>
                                <div className="text-sm font-bold text-slate-700 line-clamp-1" title={bottleneckTahap}>{bottleneckTahap}</div>
                                <p className="text-[10px] text-slate-500 mt-0.5">{maxDurasiTahap > 0 ? `${maxDurasiTahap} hari` : "-"}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="relative border-l border-slate-800/20 ml-2.5 sm:ml-3.5 space-y-5 sm:space-y-6 pb-1">
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
                        <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200/50 bg-slate-50/10">
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

                          {/* Alasan Diulang / Batal */}
                          {infoTender.alasan_diulang && (
                            <div className="p-3.5 rounded-xl border relative overflow-hidden" style={{ backgroundColor: "var(--amber-subtle)", borderColor: "var(--amber-border)" }}>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "var(--amber-text)" }}>
                                <AlertTriangle className="w-3.5 h-3.5" /> Alasan Tender Diulang / Dibatalkan
                              </p>
                              <p className="text-sm font-semibold" style={{ color: "var(--amber-text)" }}>{infoTender.alasan_diulang}</p>
                            </div>
                          )}

                          {/* Satuan Kerja */}
                          {infoTender.satuan_kerja && (
                            <div className="p-3 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                                <Building2 className="w-3.5 h-3.5 text-slate-500" /> Satuan Kerja
                              </p>
                              <p className="text-sm font-semibold">{infoTender.satuan_kerja}</p>
                            </div>
                          )}

                          {/* Lokasi Pekerjaan */}
                          {infoTender.lokasi_pekerjaan && (
                            <div className="p-3 rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Lokasi Pekerjaan
                              </p>
                              <p className="text-sm font-semibold">{infoTender.lokasi_pekerjaan}</p>
                            </div>
                          )}

                          {/* Syarat Kualifikasi */}
                          {infoTender.syarat_kualifikasi && (
                            <div className="p-3 rounded-xl border flex flex-col gap-2" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                              <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Syarat Kualifikasi
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

                          {/* Panel Data Pemenang */}
                          {infoTender.pemenang_nama && (
                            <div className="mt-4 p-4 rounded-xl border relative overflow-hidden" style={{ backgroundColor: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" }}>
                              <div className="absolute top-0 right-0 bg-slate-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg">WINNER</div>
                              <p className="text-xs font-bold text-slate-600 mb-1 flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> Data Pemenang</p>
                              <h4 className="text-sm font-black text-slate-700 mb-2">{infoTender.pemenang_nama}</h4>
                              <div className="space-y-1.5">
                                {infoTender.pemenang_npwp && <p className="text-[10px] text-slate-600"><span className="font-bold">NPWP:</span> {infoTender.pemenang_npwp}</p>}
                                {infoTender.pemenang_harga && <p className="text-[10px] text-slate-600"><span className="font-bold">Harga Penawaran:</span> {infoTender.pemenang_harga}</p>}
                                {infoTender.pemenang_alamat && <p className="text-[10px] text-slate-600/80"><span className="font-bold">Alamat:</span> {infoTender.pemenang_alamat}</p>}
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

                  {/* TAB 3: PESERTA */}
                  {lpseTab === "peserta" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                        <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                          <Users className="w-4 h-4 text-[var(--accent)]" /> {language === "EN" ? "Participants & Bidders" : "Daftar Peserta Lelang"}
                        </h2>
                      </div>
                      
                      {infoLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 opacity-70">
                          <Loader2 className="w-8 h-8 animate-spin mb-3 text-[var(--accent)]" />
                          <p className="text-xs font-semibold">{language === "EN" ? "Loading participants data..." : "Memuat data peserta..."}</p>
                        </div>
                      ) : infoError ? (
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-red-600 flex gap-3 text-sm font-medium">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <p>{infoError}</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {infoTender?.pemenang_nama && (
                            <div className="p-4 sm:p-5 rounded-xl border relative overflow-hidden" style={{ backgroundColor: "rgba(34, 197, 94, 0.04)", borderColor: "rgba(34, 197, 94, 0.2)" }}>
                              {/* Background Pattern */}
                              <div className="absolute -right-6 -top-6 text-green-500/5 rotate-12">
                                <Trophy className="w-32 h-32" />
                              </div>
                              
                              <div className="relative z-10 flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: "rgba(34, 197, 94, 0.15)" }}>
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm border border-green-200">
                                  <Trophy className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="text-base font-extrabold text-green-700">{language === "EN" ? "Winner" : "Pemenang Tender"}</h3>
                                  <p className="text-[11px] text-green-600 font-semibold">{language === "EN" ? "Congratulations to the winner" : "Selamat kepada pemenang lelang"}</p>
                                </div>
                              </div>
                              
                              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                                <div>
                                  <span className="text-[10px] font-bold text-green-600/70 uppercase tracking-wider block mb-1">Nama Perusahaan</span>
                                  <p className="text-sm font-bold text-slate-800 flex items-start gap-2">
                                    <Building2 className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
                                    <span>{infoTender.pemenang_nama}</span>
                                  </p>
                                </div>
                                {infoTender.pemenang_npwp && (
                                  <div>
                                    <span className="text-[10px] font-bold text-green-600/70 uppercase tracking-wider block mb-1">NPWP</span>
                                    <p className="text-sm font-semibold text-slate-700 font-mono">{infoTender.pemenang_npwp}</p>
                                  </div>
                                )}
                                {infoTender.pemenang_alamat && (
                                  <div className="sm:col-span-2">
                                    <span className="text-[10px] font-bold text-green-600/70 uppercase tracking-wider block mb-1">Alamat</span>
                                    <p className="text-sm font-medium text-slate-700 leading-snug flex items-start gap-2">
                                      <MapPin className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
                                      <span>{infoTender.pemenang_alamat}</span>
                                    </p>
                                  </div>
                                )}
                                {infoTender.pemenang_harga && (
                                  <div className="sm:col-span-2 mt-1 p-3 rounded-lg bg-green-50/80 border border-green-100/60 flex items-center justify-between">
                                    <span className="text-xs font-bold text-green-700">Harga Penawaran / Terkoreksi</span>
                                    <span className="text-sm font-black text-green-800">{infoTender.pemenang_harga}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Tabel Data Peserta */}
                          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
                            {(() => {
                              if (!infoTender?.peserta_evaluasi?.rows?.length) return (
                                <div className="py-8 px-4 text-center">
                                  <div className="flex flex-col items-center justify-center opacity-50 space-y-2">
                                    <Users className="w-10 h-10 mb-1" />
                                    <p className="font-bold text-sm">Belum Ada Data Peserta</p>
                                    <p className="max-w-[280px]">Data peserta / hasil evaluasi belum tersedia untuk publik.</p>
                                  </div>
                                </div>
                              );

                              const rawHeaders = infoTender.peserta_evaluasi.headers || [];
                              const rawRows = infoTender.peserta_evaluasi.rows;

                              // 1. Align rows first
                              const alignedRows = rawRows.map((row: any[]) => {
                                let alignedRow = row;
                                if (rawHeaders.length > 0 && row.length !== rawHeaders.length) {
                                  alignedRow = new Array(rawHeaders.length).fill({ text: "", hasCheck: false, hasCross: false, hasStar: false });
                                  alignedRow[0] = row[0] || alignedRow[0];
                                  alignedRow[1] = row[1] || alignedRow[1];
                                  
                                  const alasanIdx = rawHeaders.findIndex((h: string) => h.toLowerCase().includes("alasan"));
                                  if (alasanIdx !== -1 && row.length > 2) {
                                    alignedRow[alasanIdx] = row[row.length - 1];
                                  }
                                  
                                  let rowCursor = 2;
                                  for (let i = 2; i < rawHeaders.length; i++) {
                                    if (i === alasanIdx) continue;
                                    
                                    const h = rawHeaders[i].toLowerCase();
                                    
                                    // If column is NPWP, check if the current cell looks like NPWP
                                    if (h.includes("npwp")) {
                                      const rText = row[rowCursor]?.text || "";
                                      // NPWP usually has format like 00.123.456.7-890.000 or ***
                                      if (rText.match(/[\d*.\-]{8,}/)) {
                                        alignedRow[i] = row[rowCursor];
                                        rowCursor++;
                                      } else {
                                        // Skip NPWP cell, rowCursor stays the same
                                        alignedRow[i] = { text: "", hasCheck: false, hasCross: false, hasStar: false };
                                      }
                                    } else {
                                      // For all other columns (Harga, K, SK, SB, B, dll), just take the next cell
                                      if (rowCursor < row.length - (alasanIdx !== -1 && row.length > 2 ? 1 : 0)) {
                                        alignedRow[i] = row[rowCursor];
                                        rowCursor++;
                                      }
                                    }
                                  }
                                }
                                return alignedRow;
                              });

                              // 2. Determine which columns have at least one non-empty cell
                              const activeCols = new Array(rawHeaders.length).fill(false);
                              if (rawHeaders.length > 0) {
                                activeCols[0] = true; // Always keep NO
                                activeCols[1] = true; // Always keep NAMA PESERTA

                                alignedRows.forEach((row: any[]) => {
                                  row.forEach((cell: any, cIdx: number) => {
                                    if (cell?.text || cell?.hasCheck || cell?.hasCross || cell?.hasStar) {
                                      activeCols[cIdx] = true;
                                    }
                                  });
                                });

                                // Force keep "Alasan" column if it exists just in case
                                const alasanIdx = rawHeaders.findIndex((h: string) => h.toLowerCase().includes("alasan"));
                                if (alasanIdx !== -1) activeCols[alasanIdx] = true;
                              }

                              const finalHeaders = rawHeaders.length > 0 ? rawHeaders.filter((_: any, idx: number) => activeCols[idx]) : ["No", "Nama Peserta", "NPWP", "Harga Penawaran"];
                              const finalRows = rawHeaders.length > 0 ? alignedRows.map((row: any[]) => row.filter((_: any, idx: number) => activeCols[idx])) : alignedRows;

                              return (
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                  <thead className="bg-slate-50/80">
                                    <tr>
                                      {finalHeaders.map((h: string, idx: number) => (
                                        <th key={idx} className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                                    {finalRows.map((row: any[], rIdx: number) => (
                                      <tr key={rIdx} className="hover:bg-slate-50/50">
                                        {row.map((cell: any, cIdx: number) => (
                                          <td key={cIdx} className="py-3 px-4">
                                            <div className="flex items-center gap-1.5">
                                              {cell?.hasStar && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                                              <span>{cell?.text}</span>
                                              {cell?.hasCheck && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                              {cell?.hasCross && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                            </div>
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: ANALISA HARGA PENAWARAN & RINGKASAN */}
                  {lpseTab === "ai" && (
                    <div className="space-y-6">
                      
                      {/* GENERAL AI SUMMARY (Hanya tampil jika belum ada pemenang) */}
                      {(!infoTender?.pemenang_nama || !infoTender) && (
                        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                          <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            {language === "EN" ? "AI Analysis Result" : "Hasil Analisa"}
                          </h3>
                        </div>
                        <div className="p-4">
                          <AIAnalysisPanel ai={aiSummary} loading={aiLoading} error={aiError} language={language} item={item} />
                        </div>
                      </div>
                      )}

                      {/* BIDDING ANALYSIS SECTION */}
                      <div className="space-y-4">
                        {/* Loading state */}
                        {infoLoading && (
                          <div className="space-y-3 animate-pulse">
                            <div className="h-4 rounded w-1/3" style={{ backgroundColor: "var(--bg-badge)" }} />
                            {[1,2,3].map(i => (
                              <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: "var(--bg-badge)" }} />
                            ))}
                          </div>
                        )}

                        {/* Error state */}
                        {infoError && (
                          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-600">{infoError}</p>
                          </div>
                        )}

                        {/* No evaluating data — fallback */}
                        {!infoLoading && !infoError && infoTender && !infoTender.pemenang_nama && !infoTender?.peserta_evaluasi?.rows?.length && (
                          <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                              <BrainCircuit className="w-6 h-6 text-slate-400" />
                            </div>
                            <h3 className="text-sm font-bold mb-1 text-slate-700">Belum Ada Data Penawaran</h3>
                            <p className="text-xs text-slate-500 max-w-xs">Analisa harga penawaran (Bidding Analysis) akan tersedia setelah ada peserta yang memasukkan harga.</p>
                          </div>
                        )}

                        {/* Chart & AI Analysis */}
                        {!infoLoading && !infoError && infoTender && (() => {
                          const parsePagu = (paguStr: string) => {
                            if (!paguStr) return 0;
                            const match = paguStr.match(/(?:Rp\.?\s*)?((?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d+)?)/i);
                            if (match && match[1]) {
                              const numStr = match[1].replace(/\./g, "").replace(/,/g, ".");
                              return parseFloat(numStr) || 0;
                            }
                            return 0;
                          };

                          const formatRupiah = (val: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

                          if (!infoTender?.peserta_evaluasi?.rows?.length) {
                            return (
                              <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <p className="text-sm text-slate-500">Tidak ada data evaluasi peserta yang ditemukan untuk dianalisis.</p>
                              </div>
                            );
                          }

                          const headers = infoTender.peserta_evaluasi.headers || [];
                          const namaIdx = headers.findIndex((h: string) => h.toLowerCase().includes("nama"));
                          const safeNamaIdx = namaIdx !== -1 ? namaIdx : 1;

                          const chartData: any[] = [];
                          infoTender.peserta_evaluasi.rows.forEach((row: any[]) => {
                            const nama = row[safeNamaIdx]?.text || "Unknown";
                            let hargaText = "";
                            for (let i = 2; i < row.length; i++) {
                              const txt = row[i]?.text || "";
                              if (txt.match(/Rp/i) || txt.match(/^\d{1,3}(\.\d{3})+(,\d+)?/)) {
                                hargaText = txt; break;
                              }
                            }
                            const hargaNum = parsePagu(hargaText);
                            if (hargaNum > 0) {
                              const isWinner = row.some((col: any) => col.hasStar) || (infoTender.pemenang_nama && nama.toLowerCase().includes(infoTender.pemenang_nama.toLowerCase().substring(0, 15)));
                              chartData.push({
                                nama: nama.length > 20 ? nama.substring(0, 20) + "..." : nama,
                                fullNama: nama,
                                harga: hargaNum,
                                isWinner,
                                fill: isWinner ? "#10b981" : "#ef4444"
                              });
                            }
                          });
                          chartData.sort((a, b) => a.harga - b.harga);
                          const paguTender = parsePagu(item.pagu || "0");

                          if (chartData.length === 0) {
                            return (
                              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <p className="text-sm text-slate-500">Tidak ada data penawaran harga peserta yang dapat dibaca dari tabel evaluasi LPSE.</p>
                              </div>
                            );
                          }

                          return (
                            <>
                              {/* Chart */}
                              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                                  <span className="w-2 h-4 rounded-full bg-emerald-500 inline-block" />
                                  Grafik Harga Penawaran Peserta
                                </h3>
                                <p className="text-[10px] text-slate-400 mb-4">🟢 Pemenang &nbsp;🔴 Peserta Lain &nbsp;— Garis putus-putus = Nilai Pagu</p>
                                <ResponsiveContainer width="100%" height={280}>
                                  <BarChart data={chartData} margin={{ left: 20, right: 20, top: 10, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="nama" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} />
                                    <YAxis tickFormatter={(v) => `Rp${(v/1e9).toFixed(1)}M`} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip
                                      cursor={{ fill: "#f8fafc" }}
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                          const d = payload[0].payload;
                                          return (
                                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xl max-w-xs">
                                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{d.isWinner ? "🏅 Pemenang" : "❌ Penawaran Kalah"}</p>
                                              <p className="text-xs font-bold text-slate-800 mb-1 leading-tight">{d.fullNama}</p>
                                              <p className={`text-sm font-black ${d.isWinner ? "text-emerald-600" : "text-rose-600"}`}>{formatRupiah(d.harga)}</p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    {paguTender > 0 && (
                                      <ReferenceLine y={paguTender} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: "top", value: "Pagu", fill: "#94a3b8", fontSize: 10 }} />
                                    )}
                                    <Bar dataKey="harga" radius={[4, 4, 0, 0]} barSize={32}>
                                      {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} opacity={entry.isWinner ? 1 : 0.65} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>

                              {/* AI Strategi */}
                              <AiBiddingAnalysis
                                namaPaket={item.nama_produk || ""}
                                pagu={item.pagu || ""}
                                hps={item.hps || ""}
                                pemenangNama={infoTender.pemenang_nama || ""}
                                pemenangHarga={infoTender.pemenang_harga || ""}
                                peserta={chartData}
                              />
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                </div>
              </div>


              {/* KOLOM KANAN: Ringkasan Nilai & LPSE Action (1/3 width) */}
              <div className="space-y-4 sm:space-y-5">
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
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
                        <Wallet className="w-3.5 h-3.5 text-slate-500" /> {language === "EN" ? "Budget Value" : "Nilai Pagu Paket"}
                      </p>
                      <p className="text-base sm:text-xl font-extrabold text-slate-500">{item.pagu}</p>
                    </div>
                  </div>
                </div>

                {/* Skor Relevansi Personalisasi & Matchmaking */}
                {typeof item.relevance_score === "number" && item.relevance_score > 0 && (
                  <div className="p-4 sm:p-5 rounded-xl sm:rounded-xl border bg-slate-50/50 border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                      <Sparkles className="w-20 h-20 text-slate-500" />
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                      <div>
                        <h2 className="text-sm sm:text-base font-black text-indigo-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-slate-500" /> Direkomendasikan
                        </h2>
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-700/70 mt-0.5 max-w-[200px] sm:max-w-none">
                          {item.relevance_score >= 80 ? "Sangat Direkomendasikan untuk Anda" : "Cukup Cocok dengan Profil Anda"}
                        </p>
                      </div>
                      <span className="text-xl sm:text-3xl font-black text-slate-700 flex items-center gap-1">
                        {item.relevance_score}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Tombol Aksi LPSE */}
                {item.url_lpse && (
                  <a
                    href={item.lelangId ? `${item.url_lpse.endsWith('/') ? item.url_lpse.slice(0, -1) : item.url_lpse}/lelang/${item.lelangId}/pengumumanlelang` : item.url_lpse}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center justify-center gap-2.5 w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-3.5 rounded-xl font-bold transition-all hover:scale-[1.01] active:scale-[0.99] text-sm shadow-sm shadow-indigo-600/10 cursor-pointer"
                  >
                    {language === "EN" ? "Open LPSE Portal" : "Buka di LPSE"} <ExternalLink className="w-4 h-4" />
                  </a>
                )}



                {/* ── Ulasan (Di bawah tombol LPSE) ── */}
                <ReviewSection itemId={(item as any)._id || item.lelangId || String(item.id)} itemType={item.tipe || "Tender"} userId={userId} userName={userName} userAvatar={userAvatar} language={language} />

              </div>

            </div>
          ) : (
            /* ── PRODUCT DETAIL GRID (PRODUK INDONETWORK) ── */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* KOLOM KIRI: Deskripsi & Informasi (2/3 width) */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-5">
                {/* Tabs Selector */}
                <div className="flex overflow-x-auto border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <button
                    onClick={() => setActiveTab("desc")}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 font-extrabold text-xs sm:text-base border-b-2 transition-all whitespace-nowrap shrink-0"
                    style={{
                      borderColor: activeTab === "desc" ? "var(--accent)" : "transparent",
                      color: activeTab === "desc" ? "var(--text-primary)" : "var(--text-secondary)"
                    }}
                  >
                    {language === "EN" ? "Product Description" : "Deskripsi Produk"}
                  </button>
                  <button
                    onClick={() => setActiveTab("vendor")}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 font-extrabold text-xs sm:text-base border-b-2 transition-all whitespace-nowrap shrink-0"
                    style={{
                      borderColor: activeTab === "vendor" ? "var(--accent)" : "transparent",
                      color: activeTab === "vendor" ? "var(--text-primary)" : "var(--text-secondary)"
                    }}
                  >
                    {language === "EN" ? "Vendor Details" : "Informasi Vendor"}
                  </button>
                  <button
                    onClick={() => { setActiveTab("ai"); fetchAISummary(); }}
                    className="px-4 sm:px-6 py-2.5 sm:py-3 font-extrabold text-xs sm:text-base border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    style={{
                      borderColor: activeTab === "ai" ? "#8b5cf6" : "transparent",
                      color: activeTab === "ai" ? "#8b5cf6" : "var(--text-secondary)"
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {language === "EN" ? "AI Analysis" : "Analisis AI"}
                  </button>
                </div>

                <div className="p-4 sm:p-6 rounded-xl sm:rounded-xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
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
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                  <h2 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4">{language === "EN" ? "Pricing Summary" : "Ringkasan Nilai"}</h2>

                  <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
                    <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                      <Wallet className="w-3.5 h-3.5 text-slate-500" /> {language === "EN" ? "Estimated Price" : "Perkiraan Harga"}
                    </p>
                    <p className="text-base sm:text-xl font-extrabold text-slate-500">{item.pagu || "Hubungi Penjual"}</p>
                  </div>
                </div>

                {/* Vendor Contact Sidebar */}
                <div className="p-4 sm:p-5 rounded-xl sm:rounded-xl border flex flex-col gap-3.5 sm:gap-4" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                  <div className="text-center pb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <h3 className="font-extrabold text-sm sm:text-base leading-snug">
                      {item.nama_perusahaan || item.instansi}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5 mt-1.5">
                      {language === "EN" ? "Verified Vendor" : "Vendor Terverifikasi"} <ShieldCheck className="w-4 h-4 fill-emerald-500 text-white dark:text-[#0a0b0d]" />
                    </p>
                    <div className="flex items-center gap-1 mt-3 px-3 py-1 bg-slate-500/10 border border-slate-800/20 rounded-full w-fit mx-auto text-slate-500">
                      <Star className="w-3 h-3 fill-blue-500" />
                      <span className="text-[9px] font-black uppercase tracking-wider">{item.kategori || "B2B"}</span>
                    </div>
                  </div>

                  {/* WhatsApp Button */}
                  <button
                    onClick={handleWhatsApp}
                    className="w-full py-3 bg-[#25D366] text-white rounded-xl font-extrabold flex items-center justify-center gap-2 hover:bg-[#1ebe57] transition-all hover:scale-[1.01] active:scale-[0.99] text-sm shadow-sm cursor-pointer"
                  >
                    <MessageCircle className="w-4.5 h-4.5 fill-current" /> WhatsApp
                  </button>

                  {/* Phone Hubungi Button */}
                  <button
                    onClick={handleCall}
                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-extrabold flex items-center justify-center gap-2 hover:bg-slate-900 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm shadow-sm cursor-pointer"
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
                    className="flex items-center justify-center gap-2.5 w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-3 rounded-xl font-bold transition-all hover:scale-[1.01] active:scale-[0.99] text-xs cursor-pointer"
                  >
                    {language === "EN" ? "Open Vendor Website" : "Buka Situs Vendor"} <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {/* ── Ulasan (Di bawah tombol Vendor) ── */}
                <ReviewSection itemId={(item as any)._id || String(item.id)} itemType="Barang" userId={userId} userName={userName} userAvatar={userAvatar} language={language} />

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
      <div className="flex items-start gap-3 p-4 rounded-xl border border-slate-200/50 bg-slate-50/30">
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
    <div className="space-y-5">
      {/* Tingkat Kompetisi Badge & Gambaran Singkat */}
      <div className="flex flex-col gap-3">
        {ai.kompetisi && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider" 
              style={{ backgroundColor: `${kompetisiColor}15`, color: kompetisiColor, border: `1px solid ${kompetisiColor}30` }}>
              <TrendingUp className="w-3 h-3" />
              Kompetisi {ai.kompetisi}
            </span>
            {ai.alasan_kompetisi && (
              <span className="text-xs font-medium text-slate-500">{ai.alasan_kompetisi}</span>
            )}
          </div>
        )}
        
        {ai.gambaran && (
          <div className="text-sm leading-relaxed text-slate-700 bg-slate-50/80 border border-slate-100 p-4 rounded-xl">
            <p>{ai.gambaran}</p>
          </div>
        )}
      </div>

      {/* Poin Penting & Saran in a Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.isArray(ai.poin_penting) && ai.poin_penting.length > 0 && (
          <div className="p-4 rounded-xl border border-indigo-100/50 bg-white shadow-[0_2px_10px_-4px_rgba(79,70,229,0.1)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-900">
                {language === "EN" ? "Key Points" : "Poin Penting"}
              </h4>
            </div>
            <ul className="space-y-2.5">
              {ai.poin_penting.map((p: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {ai.saran && (
          <div className="p-4 rounded-xl border border-amber-100/50 bg-gradient-to-br from-amber-50/50 to-white shadow-[0_2px_10px_-4px_rgba(245,158,11,0.1)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-900">
                {language === "EN" ? "Recommendation" : "Saran Strategi"}
              </h4>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{ai.saran}</p>
          </div>
        )}
      </div>

      {/* ── Q&A Chat Box ── */}
      <div className="mt-6 pt-4 border-t border-dashed" style={{ borderColor: "var(--border-subtle)" }}>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5 text-slate-500">
          <MessageSquare className="w-3.5 h-3.5" />
          {language === "EN" ? "Ask AI About This Tender" : "Tanya AI Tentang Tender Ini"}
        </h4>
        
        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-3 rounded-xl max-w-[90%] text-sm ${
                  msg.role === "user" 
                    ? "bg-slate-500 text-white rounded-br-none" 
                    : "border rounded-bl-none"
                }`} style={msg.role === "assistant" ? { backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" } : {}}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                      a: ({node, ...props}) => <a className="text-blue-500 hover:underline font-bold" target="_blank" rel="noopener noreferrer" {...props} />,
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-4 w-full rounded-xl border border-slate-200 shadow-sm custom-scrollbar">
                          <table className="w-full text-left border-collapse min-w-[400px]" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => <thead className="bg-slate-100 text-slate-700 text-xs uppercase tracking-wide" {...props} />,
                      tbody: ({node, ...props}) => <tbody className="bg-white divide-y divide-slate-100" {...props} />,
                      tr: ({node, ...props}) => <tr className="hover:bg-slate-50 transition-colors" {...props} />,
                      th: ({node, ...props}) => <th className="p-3 font-semibold border-b border-slate-200 whitespace-nowrap" {...props} />,
                      td: ({node, ...props}) => <td className="p-3 text-xs align-middle" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isAsking && (
              <div className="flex justify-start">
                <div className="p-3 rounded-xl rounded-bl-none border flex gap-1 items-center" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-subtle)" }}>
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
            className="w-full pl-4 pr-12 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/50"
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
            className="absolute right-2 top-2 p-1.5 rounded-lg bg-slate-500 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
