"use client";

import { useEffect, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { useRouter } from "next/navigation";
import { Trophy, Clock, SearchX, Pin } from "lucide-react";
import { SearchResultItem } from "@/types";
import ProductCard from "@/components/common/ProductCard";

export default function SelesaiPage() {
  const { language, togglePin } = useDashboard();
  const router = useRouter();
  
  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSelesaiTenders() {
      try {
        const res = await fetch("/api/tenders/selesai");
        if (!res.ok) throw new Error("Gagal mengambil data tender selesai");
        const data = await res.json();
        setItems(data.items || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSelesaiTenders();
  }, []);

  const AUTO_DELETE_DAYS = 3;

  function getSisaHari(archived_at: string | null | undefined): number | null {
    if (!archived_at) return null;
    const archDate = new Date(archived_at).getTime();
    const deleteDate = archDate + AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const sisaMs = deleteDate - now;
    return Math.max(0, Math.ceil(sisaMs / (24 * 60 * 60 * 1000)));
  }

  return (
    <main
      className="p-4 sm:p-8 md:p-10 lg:p-12 pb-24 h-full flex-1 overflow-y-auto"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <div className="-mt-4 sm:-mt-8 md:-mt-10 lg:-mt-12 -mx-4 sm:-mx-8 md:-mx-10 lg:-mx-12 px-4 sm:px-8 md:px-10 lg:px-12 pt-7 sm:pt-10 md:pt-12 lg:pt-14 pb-5 sm:pb-6 border-b relative z-30 mb-6 sm:mb-8" style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-primary)" }}>
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex-1">
            <span
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block border border-transparent"
              style={{ color: "rgb(16, 185, 129)", backgroundColor: "rgba(16, 185, 129, 0.1)" }}
            >
              <Trophy className="w-3.5 h-3.5 inline mr-1" />
              {language === 'EN' ? 'Finished' : 'Selesai'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              {language === 'EN' ? 'Finished Tenders Classification' : 'Daftar Klasifikasi Tender Selesai'}
            </h1>
            <p className="text-sm sm:text-base font-medium" style={{ color: "var(--text-secondary)" }}>
              {language === 'EN' ? 'View all successfully finished tenders.' : 'Lihat semua tender yang telah mencapai tahap akhir (selesai/menang).'}
            </p>
          </div>
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 rounded-lg font-bold text-sm transition-all border shadow-sm flex items-center gap-2"
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-primary)",
                color: "var(--text-secondary)"
              }}
            >
              {language === "EN" ? "Back to Dashboard" : "Kembali ke Dashboard"}
            </button>
          </div>
        </header>
      </div>

      <div className="max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              {language === "EN" ? "Loading tenders..." : "Memuat data tender..."}
            </p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-100 text-center text-red-600">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed" style={{ borderColor: "var(--border-primary)", backgroundColor: "var(--bg-secondary)" }}>
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mb-4">
              <SearchX size={32} />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {language === "EN" ? "No finished tenders found" : "Belum ada tender yang selesai"}
            </h3>
            <p className="text-sm max-w-md" style={{ color: "var(--text-muted)" }}>
              {language === "EN" 
                ? "Tenders that reach the finished stage will automatically appear here." 
                : "Tender yang telah mencapai tahap selesai atau diumumkan pemenangnya akan otomatis muncul di sini."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {items.map((item) => {
              const isPinned = false; // Karena ini bukan halaman tersimpan, pin status bisa dihiraukan atau disambungkan ke state global jika mau
              
              // Tambahkan badge countdown
              const sisaHari = getSisaHari(item.archived_at);
              const customBadge = sisaHari !== null ? (
                <div
                  className="absolute top-5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm z-10 backdrop-blur-md"
                  style={{
                    backgroundColor: sisaHari <= 1 ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.8)",
                    color: sisaHari <= 1 ? "rgb(239, 68, 68)" : "var(--text-secondary)",
                    border: `1px solid ${sisaHari <= 1 ? "rgba(239, 68, 68, 0.3)" : "var(--border-primary)"}`,
                  }}
                >
                  <Clock size={10} />
                  {sisaHari === 0 
                    ? (language === "EN" ? "Deleting soon..." : "Segera dihapus...") 
                    : (language === "EN" ? `Auto-deleted in ${sisaHari} day${sisaHari > 1 ? "s" : ""}` : `Dihapus otomatis dalam ${sisaHari} hari`)
                  }
                </div>
              ) : null;

              return (
                <div key={item.id} className="relative group">
                  {customBadge}
                  <ProductCard
                    item={item}
                    isPinned={isPinned}
                    onTogglePin={() => togglePin(item)}
                    language={language}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
