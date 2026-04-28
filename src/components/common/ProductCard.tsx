import { motion } from "framer-motion";
import { Package, Layers, Bookmark, BookmarkCheck, Trash2, MapPin, Calendar, Building2 } from "lucide-react";
import { SearchResultItem } from "@/types";

import { useDashboard } from "@/app/dashboard/DashboardContext";
import { useRouter } from "next/navigation";

type ProductCardProps = {
  item: SearchResultItem;
  language: "ID" | "EN";
  isPinned: boolean;
  onTogglePin: (item: SearchResultItem) => void;
  onRemovePin?: (item: SearchResultItem) => void;
  showRemoveMode?: boolean;
};

export default function ProductCard({
  item,
  language,
  isPinned,
  onTogglePin,
  onRemovePin,
  showRemoveMode = false,
}: ProductCardProps) {
  const router = useRouter();
  const { setSelectedItem } = useDashboard();

  const handleGoToDetail = () => {
    setSelectedItem(item);
    router.push("/dashboard/detail");
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="bg-white rounded-[1.8rem] sm:rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:shadow-2xl hover:border-black transition-all group relative overflow-hidden flex flex-col"
    >
      {item.tipe === "Produk" && (
        <div className="w-full h-48 sm:h-56 bg-slate-100 overflow-hidden relative flex-shrink-0 border-b-2 border-slate-100 flex items-center justify-center">
          {item.gambar_url ? (
            <img 
              src={item.gambar_url} 
              alt={item.nama_produk} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              onError={(e) => {
                const target = e.target as HTMLElement;
                const parent = target.parentElement;
                if (parent) {
                  // Jika gambar error, sembunyikan gambar dan tampilkan placeholder
                  target.style.display = 'none';
                  parent.innerHTML = '<div class="flex flex-col items-center justify-center w-full h-full text-slate-300 gap-2 bg-slate-50"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-xs font-bold uppercase tracking-widest">Gambar Tidak Tersedia</span></div>';
                }
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-slate-300 gap-2 bg-slate-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              <span className="text-xs font-bold uppercase tracking-widest">Gambar Tidak Tersedia</span>
            </div>
          )}
        </div>
      )}

      <div className="p-5 sm:p-8 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <span className="px-3 sm:px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 truncate max-w-[70%]">
            {item.tag}
          </span>
          {item.kategori === "Jasa" ? (
            <Layers size={18} className="text-blue-500 flex-shrink-0" />
          ) : (
            <Package size={18} className="text-orange-500 flex-shrink-0" />
          )}
        </div>
        <h3 className="text-lg sm:text-xl font-black mb-1 leading-tight line-clamp-2">
          {item.nama_produk}
        </h3>
        {item.instansi && (
          <div className="flex items-center gap-1.5 text-slate-500 mb-2">
            <Building2 size={14} className="flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold truncate">{item.instansi || item.nama_perusahaan}</span>
          </div>
        )}
        {(item.pagu || item.wilayah || item.tanggal) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {item.pagu && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-100 rounded-lg text-green-600">
                <span className="text-[10px] sm:text-xs font-black leading-none">PAGU: {item.pagu}</span>
              </div>
            )}
            {item.wilayah && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
                <MapPin size={12} strokeWidth={2.5} />
                <span className="text-[10px] sm:text-xs font-bold leading-none">{item.wilayah}</span>
              </div>
            )}
            {item.tanggal && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
                <Calendar size={12} strokeWidth={2.5} />
                <span className="text-[10px] sm:text-xs font-bold leading-none">{item.tanggal}</span>
              </div>
            )}
          </div>
        )}

        <p className="text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6 line-clamp-2">
          {item.deskripsi}
        </p>

        <div className="flex gap-2 mt-auto">
          {showRemoveMode ? (
            <>
              <button 
                onClick={handleGoToDetail}
                className="flex-1 py-3 sm:py-4 bg-black text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base group-hover:bg-slate-800 transition-all shadow-lg shadow-black/10"
              >
                {language === "EN" ? "View Project" : "Lihat Lelang"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePin?.(item);
                }}
                className="px-3 sm:px-4 py-3 sm:py-4 bg-red-50 text-red-500 rounded-xl sm:rounded-2xl font-bold text-sm hover:bg-red-100 transition-all border border-red-100"
                title={language === "EN" ? "Remove from Saved" : "Hapus dari Tersimpan"}
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleGoToDetail}
                className="flex-1 py-3 sm:py-4 bg-black text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base group-hover:bg-slate-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
              >
                {item.tipe === "Produk" ? (language === "EN" ? "View Product" : "Lihat Produk") : (language === "EN" ? "View Project details" : "Lihat Detail Lelang")}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(item);
                }}
                className={`px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all border-2 flex items-center justify-center ${
                  isPinned
                    ? "bg-amber-50 border-amber-200 text-amber-500 shadow-md shadow-amber-100 hover:bg-amber-100"
                    : "bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50"
                }`}
                title={
                  isPinned
                    ? language === "EN"
                      ? "Saved"
                      : "Tersimpan"
                    : language === "EN"
                    ? "Save"
                    : "Simpan"
                }
              >
                {isPinned ? (
                  <BookmarkCheck size={18} strokeWidth={2.5} />
                ) : (
                  <Bookmark size={18} strokeWidth={2.5} />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
