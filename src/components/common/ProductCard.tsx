import { motion } from "framer-motion";
import { Package, Briefcase, Bookmark, BookmarkCheck, Trash2, MapPin, Calendar, Building2, ArrowRight } from "lucide-react";
import { SearchResultItem } from "@/types";

import { useDashboard } from "@/app/dashboard/DashboardContext";

type ProductCardProps = {
  item: SearchResultItem;
  language: "ID" | "EN";
  isPinned: boolean;
  onTogglePin: (item: SearchResultItem) => void;
  onRemovePin?: (item: SearchResultItem) => void;
  showRemoveMode?: boolean;
  customBadge?: React.ReactNode;
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

export default function ProductCard({
  item,
  language,
  isPinned,
  onTogglePin,
  onRemovePin,
  showRemoveMode = false,
  customBadge,
}: ProductCardProps) {
  const { setSelectedItem } = useDashboard();

  const handleGoToDetail = () => {
    setSelectedItem(item);
  };

  const isJasa = item.tipe === "Jasa";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 cursor-pointer h-full relative"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-primary)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 16px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-primary)";
        (e.currentTarget as HTMLDivElement).style.transform = "none";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
      }}
      onClick={handleGoToDetail}
    >
      <div className="flex flex-col gap-3">
        {/* Top Header Row: Icon + Tag Pill + Custom Badge */}
        <div className="flex items-center gap-2 w-full">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={
              isJasa
                ? { backgroundColor: "var(--blue-subtle)" }
                : { backgroundColor: "#fff7ed" } // orange-50
            }
          >
            {isJasa ? (
              <Briefcase size={16} strokeWidth={2} style={{ color: "var(--blue-text)" }} />
            ) : (
              <Package size={16} strokeWidth={2} style={{ color: "#f97316" }} /> // orange-500
            )}
          </div>
          
          <div className="flex-1 flex justify-start items-center overflow-hidden gap-1.5">
            {customBadge}
            {(() => {
              const textToCheck = `${item.nama_produk} ${item.status} ${item.tahap_saat_ini}`.toLowerCase();
              const isUlang = textToCheck.includes("seleksi ulang") || textToCheck.includes("tender ulang") || textToCheck.includes("diulang");
              const isGagal = textToCheck.includes("tender gagal") || textToCheck.includes("gagal") || textToCheck.includes("batal");
              
              if (isUlang || isGagal) {
                return (
                  <span 
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 border ${isUlang ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                    title={isUlang ? "Tender ini merupakan seleksi/tender ulang" : "Tender ini gagal"}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isUlang ? 'bg-orange-500' : 'bg-red-500'} animate-pulse`}></span>
                    {isUlang ? "Diulang" : "Gagal"}
                  </span>
                );
              }
              return null;
            })()}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap"
              style={{ backgroundColor: "var(--bg-badge)", color: "var(--text-muted)" }}
            >
              {item.tag}
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3
            className="text-base font-bold leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            {item.nama_produk}
          </h3>
        </div>

        {/* Meta row */}
        <div className="flex flex-col gap-1.5 mt-1 border-t pt-3" style={{ borderColor: "var(--border-subtle)" }}>
          {item.instansi && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <Building2 size={13} strokeWidth={2} />
              <span className="truncate">{item.instansi}</span>
            </span>
          )}
          {item.wilayah && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <MapPin size={13} strokeWidth={2} />
              <span className="truncate">{item.wilayah}</span>
            </span>
          )}
          {item.tanggal && item.tanggal !== "-" && (
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
              <Calendar size={13} strokeWidth={2} />
              <span className="truncate">{formatDate(item.tanggal)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        {item.pagu ? (
          <span
            className="text-xs font-bold px-2 py-1 rounded-lg"
            style={{ backgroundColor: "var(--green-subtle)", color: "var(--green-text)" }}
          >
            {item.pagu}
          </span>
        ) : (
          <span className="text-[10px] italic text-slate-400">No Pagu</span>
        )}

        <div
          className="flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {showRemoveMode ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onRemovePin?.(item); }}
                className="p-2 rounded-lg border transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--red-subtle)", borderColor: "var(--red-border)", color: "var(--red-text)" }}
                title={language === "EN" ? "Remove from Saved" : "Hapus dari Tersimpan"}
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
              <button
                onClick={handleGoToDetail}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "var(--accent)" }}
              >
                <ArrowRight size={13} strokeWidth={2} />
                <span>{language === "EN" ? "View" : "Lihat"}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePin(item); }}
                className="p-2 rounded-lg border transition-all duration-150 hover:bg-[var(--bg-secondary)]"
                style={
                  isPinned
                    ? { backgroundColor: "var(--amber-subtle)", borderColor: "var(--amber-border)", color: "var(--amber-text)" }
                    : { backgroundColor: "transparent", borderColor: "var(--border-primary)", color: "var(--text-muted)" }
                }
                title={isPinned ? (language === "EN" ? "Saved" : "Tersimpan") : (language === "EN" ? "Save" : "Simpan")}
              >
                {isPinned ? (
                  <BookmarkCheck size={14} strokeWidth={2.5} />
                ) : (
                  <Bookmark size={14} strokeWidth={2} />
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleGoToDetail(); }}
                className="p-2 rounded-lg text-white transition-all duration-150 flex items-center hover:opacity-90"
                style={{ backgroundColor: "var(--accent)" }}
                title={language === "EN" ? "View Detail" : "Lihat Detail"}
              >
                <ArrowRight size={14} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
