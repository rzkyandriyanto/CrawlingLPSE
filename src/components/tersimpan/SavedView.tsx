import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, Pin } from "lucide-react";
import { SearchResultItem } from "@/types";
import ProductCard from "../common/ProductCard";

type SavedViewProps = {
  language: "ID" | "EN";
  pinnedItems: SearchResultItem[];
  onTogglePin: (item: SearchResultItem) => void;
  onRemovePin: (item: SearchResultItem) => void;
  onNavigateDashboard: () => void;
};

export default function SavedView({
  language,
  pinnedItems,
  onTogglePin,
  onRemovePin,
  onNavigateDashboard,
}: SavedViewProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {pinnedItems.length > 0 ? (
        <>
          <div className="flex items-center gap-3 mb-6 sm:mb-8">
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <Pin size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {language === "EN" ? "Saved Items" : "Item Tersimpan"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {pinnedItems.length}{" "}
                {language === "EN" ? "item(s) saved" : "item disimpan"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {pinnedItems.map((p) => (
                <ProductCard
                  key={p.id}
                  item={p}
                  language={language}
                  isPinned={true}
                  onTogglePin={onTogglePin}
                  onRemovePin={onRemovePin}
                  showRemoveMode={true}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto mt-10 sm:mt-20 text-center"
        >
          <div className="mx-auto mb-6 h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
            <Bookmark size={32} className="text-slate-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-2">
            {language === "EN" ? "No Saved Items Yet" : "Belum Ada Item Tersimpan"}
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            {language === "EN"
              ? "Save interesting products or services from search results to see them here."
              : "Simpan produk atau jasa yang menarik dari hasil pencarian untuk melihatnya di sini."}
          </p>
          <button
            onClick={onNavigateDashboard}
            className="px-6 py-3 bg-black text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
          >
            {language === "EN" ? "Find Products & Services" : "Cari Produk & Jasa"}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
