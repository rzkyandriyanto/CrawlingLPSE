"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUp, Pin, X, Filter, Package, Briefcase, User, Bell, Sparkles, CalendarClock, Trophy, ChevronDown, ChevronUp, TrendingUp, Tag, Search, Plus } from "lucide-react";
import { SearchResultItem } from "@/types";
import { useDashboard } from "./DashboardContext";
import ProductCard from "@/components/common/ProductCard";
import { KOTA_PROVINSI_MAP } from "@/lib/geoMap";
import { LocationDropdown, KOTA_INDONESIA, PROVINSI_INDONESIA } from "@/components/common/LocationDropdown";

import { Suspense } from "react";

export default function DashboardSearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

// Mock Data untuk Trending Keywords (Saran Pencarian)
const TRENDING_KEYWORDS = [
  "Laptop", "Jalan Tol", "Catering", "Gedung", "Seragam", "Kendaraan Dinas", "Obat-obatan", "Komputer", "ATK", "Konstruksi", "Event Organizer"
];

function DashboardContent() {
  const { user, language, pinnedItems, togglePin, removePin, isItemPinned, filterTipe, setFilterTipe, unreadNotifCount, notificationsHistory, markNotifAsRead } = useDashboard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryKeyword = searchParams.get("keyword");

  const [keyword, setKeyword] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isPreparing, setIsPreparing] = useState(true);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [activeFilter, setActiveFilter] = useState(filterTipe);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [errorText, setErrorText] = useState("");
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [earlyStageTenders, setEarlyStageTenders] = useState<any[]>([]);
  const [lpseStats, setLpseStats] = useState<{name: string, count: number}[]>([]);
  const [topKeywords, setTopKeywords] = useState<string[]>(TRENDING_KEYWORDS);

  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterWilayah, setFilterWilayah] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const [lpseSources, setLpseSources] = useState<string[]>([]);

  // State untuk fitur "Mencoba untuk wilayah lain?"
  const [isExtraRegionModalOpen, setIsExtraRegionModalOpen] = useState(false);
  const [extraRegionInput, setExtraRegionInput] = useState("");
  const [extraRegions, setExtraRegions] = useState<string[]>([]);
  const [extraRegionResults, setExtraRegionResults] = useState<SearchResultItem[]>([]);
  const [isFetchingExtra, setIsFetchingExtra] = useState(false);

  useEffect(() => {
    fetch("/api/lpse-sources")
      .then(res => res.json())
      .then(data => {
        if (data.sources) setLpseSources(data.sources);
      })
      .catch(err => console.error("Failed to fetch LPSE sources", err));
  }, []);
  const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const mainRef = useRef<HTMLElement>(null);
  const hasAutoLoaded = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<SearchResultItem[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    // Check initial state
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const normalizeBidang = (input: unknown): string[] => {
    if (Array.isArray(input)) return input.map((x) => String(x).trim()).filter(Boolean);
    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!trimmed) return [];
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
        } catch { }
      }
      return trimmed.split(",").map((x) => x.trim()).filter(Boolean);
    }
    return [];
  };

  const selectedBidang = useMemo(() => normalizeBidang(user?.tag), [user?.tag]);

  const runSearch = useCallback(
    async (searchKeyword: string, isAuto = false, isLoadMore = false) => {
      const trimmedKeyword = searchKeyword.trim();

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (!isAuto && !isLoadMore) setIsSearching(true);
      if (!isLoadMore) setHasMore(true);
      if (isLoadMore) setIsLoadingMore(true);
      setErrorText("");

      try {
        const currentResults = resultsRef.current;
        const res = await fetch("/api/keyword-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyword: trimmedKeyword,
            bidang: selectedBidang,
            offset: isLoadMore ? currentResults.length : 0,
            existingNames: isLoadMore ? currentResults.map(r => r.nama_produk) : [],
            language,
            filterWilayah,
            filterTipe,
            filterStatus,
            filterTanggal: [filterDate, filterMonth, filterYear].filter(Boolean).join(" ") || undefined,
            userId: user?.id || undefined,
          }),
          signal: controller.signal
        });
        const payload = (await res.json()) as {
          items?: Array<Omit<SearchResultItem, "id">>;

          lpseStats?: {name: string, count: number}[];
          earlyStageTenders?: any[];
          topKeywords?: string[];
          error?: string;
        };
        if (!res.ok) {
          if (!isLoadMore) setResults([]);
          setErrorText(payload.error || "Pencarian gagal.");
          return;
        }

        const mapped = (payload.items || []).map((item, index) => ({
          ...item,
          id: `${trimmedKeyword}-${Date.now()}-${index}`,
        }));

        if (mapped.length === 0) {
          setHasMore(false);
        }

        setResults((prev) => (isLoadMore ? [...prev, ...mapped] : mapped));
        if (!isLoadMore) {

          if (payload.lpseStats) setLpseStats(payload.lpseStats);
          if (payload.earlyStageTenders) setEarlyStageTenders(payload.earlyStageTenders);
          if (payload.topKeywords && payload.topKeywords.length > 0) setTopKeywords(payload.topKeywords);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // Ignore abort errors
          return;
        }
        if (!isLoadMore) setResults([]);
        setErrorText(
          error instanceof Error ? error.message : "Terjadi kesalahan jaringan.",
        );
      } finally {
        // Only cleanup if it's the current controller
        if (abortControllerRef.current === controller) {
          if (!isAuto && !isLoadMore) setIsSearching(false);
          if (isLoadMore) setIsLoadingMore(false);
          if (isAuto) setIsPreparing(false);
        }
      }
    },
    [selectedBidang, language, filterWilayah, filterTipe, filterStatus, filterDate, filterMonth, filterYear],
  );

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    if (!user) return;

    // Jika ada keyword di URL, gunakan itu (prioritas).
    if (queryKeyword) {
      setKeyword(queryKeyword);
      void runSearch(queryKeyword, true);
    }
    // Jalankan pencarian otomatis jika tab berubah (Produk/Jasa) atau saat pertama kali load
    else if (selectedBidang.length > 0) {
      // Kita gunakan ref untuk mencatat filter terakhir agar tidak loop
      void runSearch(keyword || "", true);
    }
  }, [user, selectedBidang, runSearch, queryKeyword, filterTipe]);

  // Trigger welcome email on first dashboard visit
  useEffect(() => {
    if (!user || !user.id) return;
    
    const welcomeSentKey = `welcomeEmailSent_${user.id}`;
    if (!localStorage.getItem(welcomeSentKey)) {
      localStorage.setItem(welcomeSentKey, "true");
      fetch("/api/auth/welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      }).catch(err => console.error("Failed to trigger welcome email:", err));
    }
  }, [user]);

  const handleKeywordSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await runSearch(keyword, false);
  };

  const fetchExtraRegions = async () => {
    if (!user || extraRegions.length === 0) return;
    setIsFetchingExtra(true);
    setExtraRegionResults([]);
    try {
      const res = await fetch("/api/keyword-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          bidang: selectedBidang,
          filterWilayah,
          filterTipe,
          filterStatus,
          offset: 0,
          userId: user.id,
          extraRegions
        })
      });
      const data = await res.json();
      setExtraRegionResults(data.items || []);
      setIsExtraRegionModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingExtra(false);
    }
  };

  const filteredResults =
    activeFilter === "Semua"
      ? results
      : results.filter((p) => p.tipe === activeFilter);

  return (
    <main
      ref={mainRef}
      className="p-4 sm:p-8 md:p-10 lg:p-12 pb-24 h-full flex-1 overflow-y-auto"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <div
        className="-mt-4 sm:-mt-8 md:-mt-10 lg:-mt-12 -mx-4 sm:-mx-8 md:-mx-10 lg:-mx-12 px-4 sm:px-8 md:px-10 lg:px-12 pt-16 sm:pt-10 md:pt-12 lg:pt-14 pb-5 sm:pb-6 relative z-30 mb-6 sm:mb-8"
        style={{ backgroundColor: "var(--bg-primary)", borderBottom: "1px solid var(--border-primary)" }}
      >
        <header className="mb-6 sm:mb-8 flex flex-col">
          {/* Top Row Desktop: Label (Left) and Avatar (Right) */}
          <div className="hidden sm:flex items-start justify-between w-full mb-3">
            <span
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mt-2"
              style={{ color: "var(--accent)", backgroundColor: "var(--accent-subtle)" }}
            >
              {language === 'EN' ? 'Dashboard' : 'Beranda'}
            </span>
            <button
              onClick={() => router.push("/dashboard/profil")}
              className="flex items-center gap-3 pr-1.5 pl-4 py-1.5 rounded-full hover:shadow-md transition-all duration-200 group -mt-1 border"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}
              title="Ke Profil Anda"
            >
              <span className="text-sm font-semibold truncate max-w-[120px]" style={{ color: "var(--text-secondary)" }}>
                {user?.nama || user?.perusahaan || "Pengguna"}
              </span>
              <div
                className="w-9 h-9 rounded-full overflow-hidden ring-2 shrink-0 flex items-center justify-center transition-all"
                style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
              >
                {user?.foto_url ? (
                  <img src={user.foto_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} strokeWidth={2.5} />
                )}
              </div>
            </button>
          </div>

          {/* Top Row Mobile: Label only */}
          <div className="flex sm:hidden mb-3">
            <span
              className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block"
              style={{ color: "var(--accent)", backgroundColor: "var(--accent-subtle)" }}
            >
              {language === 'EN' ? 'Dashboard' : 'Beranda'}
            </span>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-black mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                Selamat datang kembali, {user?.nama || user?.perusahaan || "Pengguna"}! 👋
              </h1>
              <p className="text-sm sm:text-base font-medium" style={{ color: "var(--text-muted)" }}>
                Berikut adalah Barang dan Jasa properti yang telah disesuaikan.
              </p>
            </div>

            {/* Avatar Mobile */}
            <div className="flex sm:hidden items-center">
              <button
                onClick={() => router.push("/dashboard/profil")}
                className="flex items-center gap-3 pr-1.5 pl-4 py-1.5 rounded-full hover:shadow-md transition-all duration-200 group border"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}
                title="Ke Profil Anda"
              >
                <span className="text-sm font-semibold truncate max-w-[120px]" style={{ color: "var(--text-secondary)" }}>
                  {user?.nama || user?.perusahaan || "Pengguna"}
                </span>
                <div
                  className="w-10 h-10 rounded-full overflow-hidden ring-2 transition-all flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                >
                  {user?.foto_url ? (
                    <img src={user.foto_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} strokeWidth={2.5} />
                  )}
                </div>
              </button>
            </div>
          </div>
        </header>

        {!isPreparing && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <form onSubmit={handleKeywordSearch} className="mb-3 sm:mb-4 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex gap-2 relative">
              <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={language === 'EN' ? "e.g. laptop procurement, road construction, planning services" : "Contoh: pengadaan laptop, konstruksi jalan, jasa konsultan tata ruang"}
                  className="flex-1 rounded-xl border px-4 py-3 text-sm w-full min-w-0 outline-none transition-all duration-200"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border-primary)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex-shrink-0 px-4 rounded-xl border transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: showFilterDropdown || filterWilayah || filterDate ? "var(--accent)" : "var(--bg-input)",
                    borderColor: showFilterDropdown || filterWilayah || filterDate ? "var(--accent)" : "var(--border-primary)",
                    color: showFilterDropdown || filterWilayah || filterDate ? "#fff" : "var(--text-secondary)",
                  }}
                  title={language === 'EN' ? "LPSE Source & Filters" : "Sumber LPSE & Filter"}
                >
                  <Filter size={20} />
                </button>

                <AnimatePresence>
                  {showFilterDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-14 left-0 sm:left-auto sm:right-0 mt-3 border shadow-2xl rounded-2xl p-4 w-[280px] sm:w-[320px] z-50 pointer-events-auto"
                      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}
                    >
                      <div className="mb-4">
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{language === "EN" ? "LPSE Source Target" : "Target Sumber LPSE"}</label>
                        <div className="border rounded-xl overflow-hidden flex flex-col" style={{ borderColor: "var(--border-primary)", backgroundColor: "var(--bg-input)" }}>
                          <button
                            type="button"
                            onClick={() => setFilterWilayah("")}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors border-b flex justify-between items-center ${!filterWilayah ? 'bg-amber-50/50 font-bold' : 'hover:bg-slate-50'}`}
                            style={{ borderColor: "var(--border-primary)" }}
                          >
                            <span className={!filterWilayah ? 'text-amber-700' : 'text-slate-700'}>
                              {language === "EN" ? "All (Auto Detect)" : "Semua Instansi (Otomatis)"}
                            </span>
                          </button>
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {lpseStats.length > 0 ? (
                              lpseStats.map(stat => (
                                <button
                                  key={stat.name}
                                  type="button"
                                  onClick={() => setFilterWilayah(stat.name)}
                                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex justify-between items-center ${filterWilayah === stat.name ? 'bg-amber-50/50' : 'hover:bg-slate-50'}`}
                                >
                                  <span className={`truncate mr-2 ${filterWilayah === stat.name ? 'font-bold text-amber-700' : 'text-slate-700'}`}>{stat.name}</span>
                                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full shrink-0">
                                    {stat.count.toLocaleString('id-ID')}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-xs text-slate-400 text-center italic">Tidak ada data.</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{language === "EN" ? "Tender Status" : "Status Tender"}</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none appearance-none cursor-pointer"
                          style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                        >
                          <option value="Aktif">{language === "EN" ? "Active & Recently Finished" : "Aktif & Baru Selesai"}</option>
                          <option value="Selesai">{language === "EN" ? "Finished" : "Selesai"}</option>
                          <option value="Gagal">{language === "EN" ? "Failed/Cancelled" : "Gagal/Batal"}</option>
                          <option value="Diulang">{language === "EN" ? "Retender/Failed (Badge)" : "Tender Ulang / Gagal"}</option>
                          <option value="Semua">{language === "EN" ? "All Status" : "Semua Status"}</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{language === "EN" ? "Deadline Filter" : "Filter Batas Pendaftaran"}</label>
                        <div className="flex gap-2">
                          <select
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="flex-shrink-0 w-16 rounded-xl border px-2 py-2 text-xs sm:text-sm outline-none appearance-none cursor-pointer text-center"
                            style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                          >
                            <option value="">DD</option>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d).padStart(2, '0')}>{d}</option>)}
                          </select>
                          <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                            className="flex-1 rounded-xl border px-2 py-2 text-xs sm:text-sm outline-none appearance-none cursor-pointer"
                            style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                          >
                            <option value="">{language === "EN" ? "Month" : "Bulan"}</option>
                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="flex-shrink-0 w-20 rounded-xl border px-2 py-2 text-xs sm:text-sm outline-none appearance-none cursor-pointer text-center"
                            style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                          >
                            <option value="">YYYY</option>
                            {[...Array(10)].map((_, i) => {
                              const y = new Date().getFullYear() + 2 - i;
                              return <option key={y} value={String(y)}>{y}</option>
                            })}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setFilterWilayah(""); setFilterStatus("Semua"); setFilterDate(""); setFilterMonth(""); setFilterYear(""); }} className="flex-1 py-2 text-xs font-semibold transition-colors" style={{ color: "var(--text-muted)" }}>{language === "EN" ? "Reset" : "Hapus"}</button>
                        <button type="button" onClick={() => { setShowFilterDropdown(false); void runSearch(keyword, false); }} className="flex-1 py-2 text-white text-xs font-bold rounded-xl" style={{ backgroundColor: "var(--accent)" }}>{language === "EN" ? "Apply" : "Terapkan"}</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-3 text-white rounded-xl font-semibold disabled:opacity-60 w-full sm:w-auto flex-shrink-0 transition-all duration-200"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {isSearching ? (language === 'EN' ? "Searching..." : "Mencari...") : (language === 'EN' ? "Search" : "Cari")}
              </button>
            </form>

            {/* Popular Search Suggestions */}
            <div className="mb-4 sm:mb-5">
              <div className="flex items-center gap-2 mb-2 px-1">
                <TrendingUp size={14} className="text-blue-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'EN' ? 'Popular Searches' : 'Pencarian Populer'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {topKeywords.map((kw, idx) => {
                  const currentKeywords = keyword.split(" ").map(k => k.trim()).filter(Boolean);
                  const isSelected = currentKeywords.includes(kw);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        let newKeywords;
                        if (isSelected) {
                          newKeywords = currentKeywords.filter(k => k !== kw);
                        } else {
                          newKeywords = [...currentKeywords, kw];
                        }
                        const newKeywordStr = newKeywords.join(" ");
                        setKeyword(newKeywordStr);
                        void runSearch(newKeywordStr, false);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-bold transition-all border group"
                      style={{ 
                        backgroundColor: isSelected ? "var(--accent)" : "var(--bg-card)",
                        borderColor: isSelected ? "var(--accent)" : "var(--border-primary)",
                        color: isSelected ? "#fff" : "var(--text-secondary)"
                      }}
                    >
                      {kw}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorText ? (
              <div className="mb-3 sm:mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorText}
              </div>
            ) : null}

            {/* Toggle Barang / Jasa */}
            <div
              className="p-1 rounded-xl flex gap-1"
              style={{ backgroundColor: "var(--bg-tertiary)" }}
            >
              {(["Barang", "Jasa"] as const).map((tipe) => {
                const isActive = activeFilter === tipe;
                return (
                  <button
                    key={tipe}
                    type="button"
                    onClick={() => {
                      setActiveFilter(tipe);
                      setFilterTipe(tipe);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm tracking-wide uppercase transition-all duration-200 ${
                      isActive
                        ? "shadow-sm"
                        : ""
                    }`}
                    style={{
                      backgroundColor: isActive ? "var(--bg-card)" : "transparent",
                      color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    <span className="font-bold whitespace-nowrap">
                      {tipe === "Barang"
                        ? (language === "EN" ? "Goods" : "Barang")
                        : (language === "EN" ? "Services" : "Jasa")}
                    </span>
                    {tipe === "Barang"
                      ? <Package size={16} strokeWidth={2.5} />
                      : <Briefcase size={16} strokeWidth={2.5} />
                    }
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>


      {isPreparing ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mt-4 sm:mt-10 rounded-2xl border p-6 sm:p-10 text-center"
          style={{ borderColor: "var(--border-primary)", backgroundColor: "var(--bg-card)" }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
            className="mx-auto mb-4 sm:mb-6 h-10 w-10 sm:h-14 sm:w-14 rounded-full border-4 border-dashed"
            style={{ borderColor: "var(--accent)" }}
          />
          <h2 className="text-xl sm:text-2xl font-black">{language === 'EN' ? 'Preparing dashboard...' : 'Menyiapkan dashboard...'}</h2>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-500">
            {language === 'EN' ? 'The system is matching procurement projects and tenders based on your selected fields.' : 'Sistem sedang mencocokkan lelang pengadaan (Tender) dari LPSE berdasarkan bidang Anda.'}
          </p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>



          {/* ── Notification Preview Section ── */}
          {notificationsHistory.length > 0 && (
            <div className="mt-6 sm:mt-8 mb-8 sm:mb-10">
              <div className="flex items-center justify-between mb-4 sm:mb-5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="p-2 rounded-lg border relative"
                    style={{ backgroundColor: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.2)" }}
                  >
                    <Bell size={16} style={{ color: "#6366f1" }} />
                    {unreadNotifCount > 0 && (
                      <span
                        className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-0.5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
                        style={{ background: "#ef4444" }}
                      >
                        {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    {language === 'EN' ? 'Notifications' : 'Notifikasi'}
                    {unreadNotifCount > 0 && (
                      <span className="ml-2 text-xs font-black text-white px-2 py-0.5 rounded-full" style={{ background: "#ef4444" }}>
                        {unreadNotifCount} baru
                      </span>
                    )}
                  </h2>
                </div>
                <button
                  onClick={() => { markNotifAsRead(); router.push("/dashboard/notifikasi"); }}
                  className="text-xs sm:text-sm font-bold text-slate-400 hover:text-black transition-colors"
                >
                  {language === 'EN' ? 'See All →' : 'Lihat Semua →'}
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {notificationsHistory.slice(0, 3).map((notif, i) => (
                  <motion.div
                    key={notif.id + notif.type + i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-3.5 rounded-xl border"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: notif.type === "new_tender" ? "rgba(34,197,94,0.2)" : "rgba(99,102,241,0.2)",
                    }}
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 flex-shrink-0 flex items-center justify-center ${notif.type === "new_tender" ? "rounded-lg" : "rounded-full"}`}
                      style={{
                        background: notif.type === "new_tender"
                          ? "linear-gradient(135deg, #22c55e, #16a34a)"
                          : "linear-gradient(135deg, #6366f1, #3b82f6)",
                      }}
                    >
                      {notif.type === "new_tender"
                        ? <Sparkles size={14} className="text-white" strokeWidth={2.5} />
                        : <CalendarClock size={14} className="text-white" strokeWidth={2.5} />}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[9px] font-extrabold uppercase tracking-widest"
                        style={{ color: notif.type === "new_tender" ? "#16a34a" : "#6366f1" }}
                      >
                        {notif.type === "new_tender" ? "✦ Tender Relevan Baru" : "⟳ Update Jadwal"}
                      </span>
                      <p className="text-sm font-bold line-clamp-1 mt-0.5" style={{ color: "var(--text-primary)" }}>
                        {notif.title}
                      </p>
                      <div className="flex gap-3 mt-0.5 flex-wrap">
                        {notif.instansi && <span className="text-xs" style={{ color: "var(--text-muted)" }}>🏛 {notif.instansi}</span>}
                        {notif.score && <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>Kecocokan {notif.score}%</span>}
                        {notif.tahap && <span className="text-xs font-semibold" style={{ color: "#6366f1" }}>Tahap: {notif.tahap}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}


          {/* ── Tender Tahap Awal (Highlight Box) ── */}
          {earlyStageTenders.length > 0 && !isPreparing && (
            <div className="mt-6 sm:mt-10 mb-8 p-4 sm:p-6 bg-slate-50 border border-blue-100 rounded-2xl relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              
              <div className="flex items-center gap-2.5 mb-5 relative z-10">
                <div className="p-1.5 sm:p-2 rounded-lg border bg-blue-100 border-blue-200">
                  <Sparkles size={16} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-tight">
                    {language === 'EN' ? 'New/Early Stage Tenders' : 'Tender Tahap Awal'} {filterTipe !== 'Semua' && filterTipe !== '' ? filterTipe : ''}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium">Peluang terbaru yang sedang dalam masa pendaftaran / pengumuman.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 relative z-10">
                {earlyStageTenders.map((t: any, idx: number) => (
                  <ProductCard
                    key={t.id || idx}
                    item={t}
                    language={language}
                    isPinned={isItemPinned(t)}
                    onTogglePin={togglePin}
                    showRemoveMode={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Results Grid (Premium Tile/Grid Cards) ── */}
          <div className="mt-4">
            <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
              Semua Hasil Pencarian
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredResults.length > 0 ? (
              filteredResults.map((p) => {
                const isSelesai = p.status === "selesai" || p.status === "menang" || p.status === "batal" || p.status === "gagal" || (p.tahap_saat_ini && /selesai|batal|gagal|penunjukan|sppbj|penandatanganan|kontrak/i.test(p.tahap_saat_ini));
                return (
                  <ProductCard
                    key={p.id}
                    item={p}
                    language={language}
                    isPinned={isItemPinned(p)}
                    onTogglePin={togglePin}
                    showRemoveMode={false}
                    customBadge={(() => {
                      const isMenangSelesai = p.status === "selesai" || p.status === "menang" || (p.tahap_saat_ini && /selesai|penunjukan|sppbj|penandatanganan|kontrak/i.test(p.tahap_saat_ini));
                      if (!isMenangSelesai) return null;

                      return (
                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                          {p.pemenang_nama && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-green-600 text-white shadow-sm flex items-center gap-1 max-w-[140px] truncate" title={`Pemenang: ${p.pemenang_nama}`}>
                              <Trophy className="w-2.5 h-2.5 shrink-0 text-yellow-300" /> <span className="truncate">{p.pemenang_nama}</span>
                            </span>
                          )}
                          {!p.pemenang_nama && isMenangSelesai && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700 border border-green-200 shrink-0">
                              Selesai
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  />
                );
              })
            ) : (
              <div className="py-12 sm:py-20 text-center font-medium text-sm sm:text-base" style={{ color: "var(--text-muted)" }}>
                {language === 'EN' ? "Enter a keyword to start searching for LPSE projects and tenders." : "Masukkan keyword untuk mulai mencari paket pengadaan atau lelang LPSE."}
              </div>
            )}
          </div>
        </div>

          {filteredResults.length > 0 && (
            <div className="mt-8 sm:mt-10 flex justify-center">
              {hasMore ? (
                <button
                  onClick={() => runSearch(keyword, false, true)}
                  disabled={isLoadingMore || isSearching}
                  className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold hover:opacity-80 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto border"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                  type="button"
                >
                  {isLoadingMore && <div className="h-5 w-5 animate-spin rounded-full border-2 border-dashed border-black" />}
                  {isLoadingMore ? (language === 'EN' ? "Loading..." : "Sedang Memuat...") : (language === 'EN' ? "Load More" : "Muat Lainnya")}
                </button>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="px-6 py-3 rounded-xl font-medium text-sm sm:text-base border"
                    style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
                  >
                    {language === 'EN' ? "All Data Displayed" : "Semua Data Ditampilkan"}
                  </div>
                  <button
                    onClick={() => setIsExtraRegionModalOpen(true)}
                    className="px-6 py-3 rounded-xl font-semibold hover:opacity-80 transition-all text-sm sm:text-base border border-blue-200 text-blue-600 bg-blue-50 flex items-center gap-2"
                  >
                    <Search size={16} /> Mencoba untuk wilayah lain?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Extra Region Results ── */}
          {extraRegionResults.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-200">
              <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Search size={20} className="text-blue-500" />
                Tender wilayah yang Anda cari
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {extraRegionResults.map((p) => {
                  const isSelesai = p.status === "selesai" || p.status === "menang" || p.status === "batal" || p.status === "gagal" || (p.tahap_saat_ini && /selesai|batal|gagal|penunjukan|sppbj|penandatanganan|kontrak/i.test(p.tahap_saat_ini));
                  return (
                    <ProductCard
                      key={p.id}
                      item={p}
                      language={language}
                      isPinned={isItemPinned(p)}
                      onTogglePin={togglePin}
                      showRemoveMode={false}
                      customBadge={(() => {
                        const isMenangSelesai = p.status === "selesai" || p.status === "menang" || (p.tahap_saat_ini && /selesai|penunjukan|sppbj|penandatanganan|kontrak/i.test(p.tahap_saat_ini));
                        if (!isMenangSelesai) return null;
                        return (
                          <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            {p.pemenang_nama && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-green-600 text-white shadow-sm flex items-center gap-1 max-w-[140px] truncate" title={`Pemenang: ${p.pemenang_nama}`}>
                                <Trophy className="w-2.5 h-2.5 shrink-0 text-yellow-300" /> <span className="truncate">{p.pemenang_nama}</span>
                              </span>
                            )}
                            {!p.pemenang_nama && isMenangSelesai && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700 border border-green-200 shrink-0">
                                Selesai
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* --- SCROLL TO TOP BUTTON --- */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-24 right-6 sm:bottom-24 sm:right-6 z-50 p-3 rounded-full shadow-xl transition-all border"
            style={{ backgroundColor: "var(--accent)", color: "#fff", borderColor: "transparent" }}
            title={language === 'EN' ? "Back to Top" : "Kembali ke Atas"}
          >
            <ArrowUp size={24} strokeWidth={2.5} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* --- EXTRA REGION MODAL --- */}
      <AnimatePresence>
        {isExtraRegionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="p-5 border-b flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-lg">Preferensi Wilayah Tambahan</h3>
                <button
                  onClick={() => setIsExtraRegionModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 flex flex-col gap-4">
                <p className="text-sm text-slate-600">
                  Tambahkan wilayah lain yang ingin Anda lihat tendernya. Wilayah ini tidak akan tercampur dengan hasil utama.
                </p>
                
                <div className="flex flex-col sm:flex-row items-stretch gap-3 relative">
                  <div className="flex-1">
                    <LocationDropdown
                      value={extraRegionInput}
                      onChange={(val) => {
                        setExtraRegionInput(val);
                        // If they pick something from the dropdown, we auto-add it
                        if (val && !extraRegions.includes(val)) {
                          setExtraRegions([...extraRegions, val]);
                          // Small delay to clear the input after adding
                          setTimeout(() => setExtraRegionInput(""), 50);
                        }
                      }}
                      options={[...KOTA_INDONESIA, ...PROVINSI_INDONESIA].sort()}
                      placeholder="Cari Kota / Provinsi (misal: Jakarta)"
                      label="wilayah"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (extraRegionInput.trim() && !extraRegions.includes(extraRegionInput.trim())) {
                        setExtraRegions([...extraRegions, extraRegionInput.trim()]);
                      }
                      setExtraRegionInput("");
                    }}
                    className="px-4 py-3 bg-[var(--accent)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shrink-0 shadow-md"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    <span className="sm:hidden">Tambah</span>
                  </button>
                </div>
                
                {extraRegions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {extraRegions.map((w, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium text-slate-700">
                        {w}
                        <button
                          onClick={() => setExtraRegions(extraRegions.filter(item => item !== w))}
                          className="hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                <button
                  onClick={() => setIsExtraRegionModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={fetchExtraRegions}
                  disabled={extraRegions.length === 0 || isFetchingExtra}
                  className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isFetchingExtra ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={16} />}
                  Cari Tender
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
