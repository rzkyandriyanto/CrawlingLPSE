import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Pin, Trophy, XCircle, CheckCircle, Clock } from "lucide-react";
import { SearchResultItem } from "@/types";
import ProductCard from "../common/ProductCard";

type SavedViewProps = {
  language: "ID" | "EN";
  pinnedItems: SearchResultItem[];
  onTogglePin: (item: SearchResultItem) => void;
  onRemovePin: (item: SearchResultItem) => void;
  onNavigateDashboard: () => void;
};

type TabKey = "aktif" | "arsip_menang" | "arsip_gagal";

const AUTO_DELETE_DAYS = 3;

/**
 * Hitung sisa hari sebelum auto-delete berdasarkan archived_at
 * Mengembalikan null jika archived_at tidak ada
 */
function getSisaHari(archived_at: string | null | undefined): number | null {
  if (!archived_at) return null;
  const archDate = new Date(archived_at).getTime();
  const deleteDate = archDate + AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const sisaMs = deleteDate - now;
  return Math.max(0, Math.ceil(sisaMs / (24 * 60 * 60 * 1000)));
}

function CountdownBadge({ archived_at, language }: { archived_at: string | null | undefined; language: "ID" | "EN" }) {
  const sisa = getSisaHari(archived_at);
  if (sisa === null) return null;

  const isUrgent = sisa <= 1;
  const label =
    sisa === 0
      ? language === "EN" ? "Deleting soon..." : "Segera dihapus..."
      : language === "EN"
        ? `Auto-deleted in ${sisa} day${sisa > 1 ? "s" : ""}`
        : `Dihapus otomatis dalam ${sisa} hari`;

  return (
    <div
      className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold w-fit"
      style={{
        backgroundColor: isUrgent ? "rgba(239, 68, 68, 0.12)" : "rgba(107, 114, 128, 0.10)",
        color: isUrgent ? "rgb(220, 38, 38)" : "var(--text-muted)",
        border: `1px solid ${isUrgent ? "rgba(239, 68, 68, 0.25)" : "var(--border-subtle)"}`,
      }}
    >
      <Clock size={10} />
      {label}
    </div>
  );
}

const TAB_CONFIG: Array<{
  key: TabKey;
  labelID: string;
  labelEN: string;
  icon: React.ReactNode;
  filter: (item: SearchResultItem) => boolean;
  emptyMsgID: string;
  emptyMsgEN: string;
  accentColor: string;
  bgColor: string;
}> = [
  {
    key: "aktif",
    labelID: "Aktif",
    labelEN: "Active",
    icon: <Pin size={14} />,
    filter: (item) => !item.status || item.status === "aktif",
    emptyMsgID: "Belum ada tender aktif yang tersimpan.",
    emptyMsgEN: "No active tenders saved yet.",
    accentColor: "rgb(99, 102, 241)",
    bgColor: "rgba(99, 102, 241, 0.10)",
  },
  {
    key: "arsip_menang",
    labelID: "Menang / Selesai",
    labelEN: "Won / Finished",
    icon: <Trophy size={14} />,
    filter: (item) => item.status === "menang" || item.status === "selesai",
    emptyMsgID: "Belum ada tender yang ditandai menang atau selesai.",
    emptyMsgEN: "No tenders marked as won or finished.",
    accentColor: "rgb(16, 185, 129)",
    bgColor: "rgba(16, 185, 129, 0.10)",
  },
  {
    key: "arsip_gagal",
    labelID: "Gagal",
    labelEN: "Failed",
    icon: <XCircle size={14} />,
    filter: (item) => item.status === "gagal",
    emptyMsgID: "Belum ada tender yang ditandai gagal.",
    emptyMsgEN: "No tenders marked as failed.",
    accentColor: "rgb(239, 68, 68)",
    bgColor: "rgba(239, 68, 68, 0.10)",
  },
];

export default function SavedView({
  language,
  pinnedItems,
  onTogglePin,
  onRemovePin,
  onNavigateDashboard,
}: SavedViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("aktif");

  const currentTab = TAB_CONFIG.find((t) => t.key === activeTab)!;
  const filteredItems = pinnedItems.filter(currentTab.filter);

  // Count per tab for badges
  const counts = TAB_CONFIG.reduce<Record<TabKey, number>>(
    (acc, tab) => {
      acc[tab.key] = pinnedItems.filter(tab.filter).length;
      return acc;
    },
    { aktif: 0, arsip_menang: 0, arsip_gagal: 0 }
  );

  if (pinnedItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto mt-10 sm:mt-20 text-center"
      >
        <div
          className="mx-auto mb-6 h-20 w-20 sm:h-24 sm:w-24 rounded-full border border-dashed flex items-center justify-center"
          style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
        >
          <Bookmark size={32} style={{ color: "var(--text-muted)" }} />
        </div>
        <h2 className="text-xl sm:text-2xl font-black mb-2" style={{ color: "var(--text-primary)" }}>
          {language === "EN" ? "No Saved Items Yet" : "Belum Ada Item Tersimpan"}
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          {language === "EN"
            ? "Save interesting products or services from search results to see them here."
            : "Simpan produk atau jasa yang menarik dari hasil pencarian untuk melihatnya di sini."}
        </p>
        <button
          onClick={onNavigateDashboard}
          className="px-6 py-3 text-white rounded-2xl font-bold text-sm transition-all shadow-lg hover:opacity-90"
          style={{ backgroundColor: "var(--accent)" }}
        >
          {language === "EN" ? "Find Products & Services" : "Cari Produk & Jasa"}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <div
          className="p-2.5 rounded-xl border"
          style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", borderColor: "rgba(245, 158, 11, 0.2)", color: "rgb(245, 158, 11)" }}
        >
          <Pin size={20} />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-black" style={{ color: "var(--text-primary)" }}>
            {language === "EN" ? "Saved Items" : "Item Tersimpan"}
          </h2>
          <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            {pinnedItems.length} {language === "EN" ? "item(s) saved" : "item disimpan"}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="flex gap-1 p-1 rounded-2xl mb-6 sm:mb-8"
        style={{ backgroundColor: "var(--bg-tertiary)" }}
      >
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = counts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200"
              style={{
                backgroundColor: isActive ? "var(--bg-card)" : "transparent",
                color: isActive ? tab.accentColor : "var(--text-muted)",
                boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <span style={{ color: isActive ? tab.accentColor : "var(--text-muted)" }}>
                {tab.icon}
              </span>
              <span className="hidden sm:inline">{language === "EN" ? tab.labelEN : tab.labelID}</span>
              <span className="sm:hidden">{language === "EN" ? tab.labelEN.split(" ")[0] : tab.labelID.split(" ")[0]}</span>
              {count > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black"
                  style={{
                    backgroundColor: isActive ? tab.accentColor : "var(--border-primary)",
                    color: isActive ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Info banner untuk tab arsip */}
      {(activeTab === "arsip_gagal" || activeTab === "arsip_menang") && filteredItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3.5 rounded-xl mb-5 border"
          style={{
            backgroundColor: activeTab === "arsip_gagal" ? "rgba(239,68,68,0.06)" : "rgba(16,185,129,0.06)",
            borderColor: activeTab === "arsip_gagal" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)",
          }}
        >
          <CheckCircle
            size={16}
            className="mt-0.5 flex-shrink-0"
            style={{ color: activeTab === "arsip_gagal" ? "rgb(239,68,68)" : "rgb(16,185,129)" }}
          />
          <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {language === "EN"
              ? `Archived tenders are automatically deleted after ${AUTO_DELETE_DAYS} days. Unpin or re-activate them to prevent deletion.`
              : `Tender yang diarsipkan akan otomatis dihapus setelah ${AUTO_DELETE_DAYS} hari. Batalkan penyimpanan atau aktifkan kembali untuk mencegah penghapusan.`}
          </p>
        </motion.div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    {/* Status badge untuk arsip */}
                    {(activeTab === "arsip_gagal" || activeTab === "arsip_menang") && (
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                          style={{
                            backgroundColor: p.status === "gagal"
                              ? "rgba(239,68,68,0.12)"
                              : p.status === "menang"
                                ? "rgba(16,185,129,0.12)"
                                : "rgba(99,102,241,0.12)",
                            color: p.status === "gagal"
                              ? "rgb(220,38,38)"
                              : p.status === "menang"
                                ? "rgb(5,150,105)"
                                : "rgb(99,102,241)",
                          }}
                        >
                          {p.status === "gagal" ? <XCircle size={10} /> : <Trophy size={10} />}
                          {p.status === "gagal"
                            ? (language === "EN" ? "Failed" : "Gagal")
                            : p.status === "menang"
                              ? (language === "EN" ? "Won" : "Menang")
                              : (language === "EN" ? "Completed" : "Selesai")}
                        </span>
                        <CountdownBadge archived_at={p.archived_at} language={language} />
                      </div>
                    )}
                    <ProductCard
                      item={p}
                      language={language}
                      isPinned={true}
                      onTogglePin={onTogglePin}
                      onRemovePin={onRemovePin}
                      showRemoveMode={true}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 sm:py-24 text-center"
            >
              <div
                className="mx-auto mb-4 h-16 w-16 rounded-full border border-dashed flex items-center justify-center"
                style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
              >
                <span style={{ color: "var(--text-muted)" }}>{currentTab.icon}</span>
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                {language === "EN" ? currentTab.emptyMsgEN : currentTab.emptyMsgID}
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
