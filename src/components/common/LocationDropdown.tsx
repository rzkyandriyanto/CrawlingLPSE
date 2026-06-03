"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// ── Data Wilayah Indonesia ────────────────────────────────────────────────────
export const PROVINSI_INDONESIA = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Kepulauan Riau",
  "Jambi", "Bengkulu", "Sumatera Selatan", "Kepulauan Bangka Belitung",
  "Lampung", "DKI Jakarta", "Jawa Barat", "Banten", "Jawa Tengah",
  "DI Yogyakarta", "Jawa Timur", "Bali", "Nusa Tenggara Barat",
  "Nusa Tenggara Timur", "Kalimantan Barat", "Kalimantan Tengah",
  "Kalimantan Selatan", "Kalimantan Timur", "Kalimantan Utara",
  "Sulawesi Utara", "Gorontalo", "Sulawesi Tengah", "Sulawesi Barat",
  "Sulawesi Selatan", "Sulawesi Tenggara", "Maluku", "Maluku Utara",
  "Papua Barat", "Papua", "Papua Selatan", "Papua Tengah",
  "Papua Pegunungan", "Papua Barat Daya",
];

// Mapping kota → provinsi (saat kota dipilih, provinsi otomatis terisi)
export const KOTA_PROVINSI_MAP: Record<string, string> = {
  // DKI Jakarta
  "Kota Jakarta Pusat": "DKI Jakarta",
  "Kota Jakarta Barat": "DKI Jakarta",
  "Kota Jakarta Timur": "DKI Jakarta",
  "Kota Jakarta Selatan": "DKI Jakarta",
  "Kota Jakarta Utara": "DKI Jakarta",
  // Jawa Barat
  "Kota Bandung": "Jawa Barat",
  "Kota Bekasi": "Jawa Barat",
  "Kota Bogor": "Jawa Barat",
  "Kota Depok": "Jawa Barat",
  "Kota Cimahi": "Jawa Barat",
  "Kota Cirebon": "Jawa Barat",
  "Kota Sukabumi": "Jawa Barat",
  "Kota Tasikmalaya": "Jawa Barat",
  "Kota Banjar": "Jawa Barat",
  // Jawa Tengah
  "Kota Semarang": "Jawa Tengah",
  "Kota Solo": "Jawa Tengah",
  "Kota Surakarta": "Jawa Tengah",
  "Kota Magelang": "Jawa Tengah",
  "Kota Salatiga": "Jawa Tengah",
  "Kota Pekalongan": "Jawa Tengah",
  "Kota Tegal": "Jawa Tengah",
  // Jawa Timur
  "Kota Surabaya": "Jawa Timur",
  "Kota Malang": "Jawa Timur",
  "Kota Kediri": "Jawa Timur",
  "Kota Blitar": "Jawa Timur",
  "Kota Madiun": "Jawa Timur",
  "Kota Mojokerto": "Jawa Timur",
  "Kota Pasuruan": "Jawa Timur",
  "Kota Probolinggo": "Jawa Timur",
  "Kota Batu": "Jawa Timur",
  // Banten
  "Kota Tangerang": "Banten",
  "Kota Tangerang Selatan": "Banten",
  "Kota Serang": "Banten",
  "Kota Cilegon": "Banten",
  // DI Yogyakarta
  "Kota Yogyakarta": "DI Yogyakarta",
  // Sumatera Utara
  "Kota Medan": "Sumatera Utara",
  "Kota Binjai": "Sumatera Utara",
  "Kota Pematangsiantar": "Sumatera Utara",
  "Kota Tebing Tinggi": "Sumatera Utara",
  "Kota Tanjungbalai": "Sumatera Utara",
  "Kota Sibolga": "Sumatera Utara",
  // Sumatera Selatan
  "Kota Palembang": "Sumatera Selatan",
  "Kota Prabumulih": "Sumatera Selatan",
  "Kota Pagaralam": "Sumatera Selatan",
  "Kota Lubuklinggau": "Sumatera Selatan",
  // Sumatera Barat
  "Kota Padang": "Sumatera Barat",
  "Kota Bukittinggi": "Sumatera Barat",
  "Kota Payakumbuh": "Sumatera Barat",
  "Kota Sawahlunto": "Sumatera Barat",
  "Kota Solok": "Sumatera Barat",
  "Kota Padang Panjang": "Sumatera Barat",
  // Riau
  "Kota Pekanbaru": "Riau",
  "Kota Dumai": "Riau",
  // Kepulauan Riau
  "Kota Batam": "Kepulauan Riau",
  "Kota Tanjungpinang": "Kepulauan Riau",
  // Aceh
  "Kota Banda Aceh": "Aceh",
  "Kota Langsa": "Aceh",
  "Kota Lhokseumawe": "Aceh",
  "Kota Sabang": "Aceh",
  "Kota Subulussalam": "Aceh",
  // Lampung
  "Kota Bandar Lampung": "Lampung",
  "Kota Metro": "Lampung",
  // Kepulauan Bangka Belitung
  "Kota Pangkalpinang": "Kepulauan Bangka Belitung",
  // Bengkulu
  "Kota Bengkulu": "Bengkulu",
  // Jambi
  "Kota Jambi": "Jambi",
  "Kota Sungai Penuh": "Jambi",
  // Kalimantan Barat
  "Kota Pontianak": "Kalimantan Barat",
  "Kota Singkawang": "Kalimantan Barat",
  // Kalimantan Selatan
  "Kota Banjarmasin": "Kalimantan Selatan",
  "Kota Banjarbaru": "Kalimantan Selatan",
  // Kalimantan Tengah
  "Kota Palangka Raya": "Kalimantan Tengah",
  // Kalimantan Timur
  "Kota Balikpapan": "Kalimantan Timur",
  "Kota Samarinda": "Kalimantan Timur",
  "Kota Bontang": "Kalimantan Timur",
  // Kalimantan Utara
  "Kota Tarakan": "Kalimantan Utara",
  // Sulawesi Selatan
  "Kota Makassar": "Sulawesi Selatan",
  "Kota Parepare": "Sulawesi Selatan",
  "Kota Palopo": "Sulawesi Selatan",
  // Sulawesi Utara
  "Kota Manado": "Sulawesi Utara",
  "Kota Tomohon": "Sulawesi Utara",
  "Kota Bitung": "Sulawesi Utara",
  "Kota Kotamobagu": "Sulawesi Utara",
  // Sulawesi Tenggara
  "Kota Kendari": "Sulawesi Tenggara",
  "Kota Baubau": "Sulawesi Tenggara",
  // Sulawesi Tengah
  "Kota Palu": "Sulawesi Tengah",
  // Gorontalo
  "Kota Gorontalo": "Gorontalo",
  // Bali
  "Kota Denpasar": "Bali",
  // Nusa Tenggara Barat
  "Kota Mataram": "Nusa Tenggara Barat",
  "Kota Bima": "Nusa Tenggara Barat",
  // Nusa Tenggara Timur
  "Kota Kupang": "Nusa Tenggara Timur",
  // Maluku
  "Kota Ambon": "Maluku",
  "Kota Tual": "Maluku",
  // Papua
  "Kota Jayapura": "Papua",
  // Papua Barat
  "Kota Sorong": "Papua Barat",
};

// Daftar kota diambil otomatis dari map di atas
export const KOTA_INDONESIA = Object.keys(KOTA_PROVINSI_MAP).sort();

export function LocationDropdown({
  value,
  onChange,
  options,
  placeholder,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen(prev => !prev);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-medium flex items-center justify-between gap-2"
        style={{
          backgroundColor: "var(--bg-input)",
          borderColor: open ? "var(--accent)" : "var(--border-primary)",
          color: value ? "var(--text-primary)" : "var(--text-muted)",
          boxShadow: open ? "0 0 0 2px var(--accent-subtle)" : "none",
        }}
      >
        <span className="truncate">{value || placeholder}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
            >
              <X size={14} style={{ color: "var(--text-muted)" }} />
            </span>
          )}
          <ChevronDown
            size={16}
            style={{
              color: "var(--text-muted)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-2 rounded-xl border shadow-xl overflow-hidden"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-primary)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
          >
            {/* Search box */}
            <div className="p-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Cari ${label}...`}
                  className="w-full bg-transparent outline-none text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                />
                {search && (
                  <button onClick={() => setSearch("")} type="button">
                    <X size={14} style={{ color: "var(--text-muted)" }} />
                  </button>
                )}
              </div>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto max-h-52">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm italic" style={{ color: "var(--text-muted)" }}>
                  Tidak ada hasil untuk "{search}"
                </div>
              ) : (
                filtered.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="w-full text-left px-4 py-3 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: opt === value ? "var(--accent-subtle)" : "transparent",
                      color: opt === value ? "var(--accent-text)" : "var(--text-primary)",
                    }}
                    onMouseEnter={e => {
                      if (opt !== value) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--bg-secondary)";
                    }}
                    onMouseLeave={e => {
                      if (opt !== value) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    }}
                  >
                    {opt}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
