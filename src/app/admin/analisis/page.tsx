"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Loader2, Package, Download, RefreshCw, TrendingUp, Building2, Tag, Banknote, BarChart3, AlertTriangle, Star } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, ComposedChart, Line, Area
} from "recharts";
import { toast } from "react-hot-toast";

interface InsightData {
  total: number;
  statusBreakdown: { status: string; count: number; pct: number }[];
  topInstansi: { nama: string; count: number }[];
  topKategori: { nama: string; count: number }[];
  avgPagu: number;
  totalNilai: number;
  tipeBreakdown?: { barang: number; jasa: number };
  avgRatingOverall?: number;
  totalRatedTenders?: number;
}

interface AnalisisData {
  id: string;
  lelangId: string;
  nama_paket: string;
  instansi: string;
  kategori: string;
  status: string;
  metode_pengadaan: string;
  pagu: string;
  hps: string;
  pagu_num: number;
  hps_num: number;
  pemenang_nama?: string;
  pemenang_harga?: string;
  pemenang_harga_num?: number;
  peserta_evaluasi?: { headers: string[]; rows: any[][] };
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  durasi_hari?: number | null;
  jumlah_reschedule?: number;
  rating?: number;
}

function formatRupiah(num: number): string {
  if (!num || num === 0) return "-";
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)} M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)} Jt`;
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)} Rb`;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

const STATUS_STYLE: Record<string, string> = {
  menang:  "bg-green-100 text-green-700",
  selesai: "bg-blue-100 text-blue-700",
  gagal:   "bg-red-100 text-red-600",
  aktif:   "bg-amber-100 text-amber-700",
};

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

// Custom tooltip untuk chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        <p className="text-slate-600">{payload[0].value} tender</p>
      </div>
    );
  }
  return null;
};


export default function AdminAnalisisPage() {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [data, setData] = useState<AnalisisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAnomalyOnly, setShowAnomalyOnly] = useState(false);
  const [mode, setMode] = useState<"completed" | "failed" | "all">("completed");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analisis?mode=${mode}`);
      const json = await res.json();
      if (res.ok) {
        setInsights(json.insights);
        setData(json.data || []);
      } else {
        toast.error("Gagal mengambil data: " + json.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Ekspor CSV (dengan hps_num & format tanggal ISO) ──
  function exportCSV() {
    const headers = [
      "Nama Paket", "Instansi", "Kategori", "Status",
      "Pagu (Teks)", "HPS (Teks)",
      "Nilai Pagu (Angka)", "Nilai HPS (Angka)",
      "Durasi (Hari)", "Jumlah Reschedule",
      "Soft Deleted", "Tanggal Dibuat (ISO)"
    ];
    const rows = filteredData.map(d => [
      `"${(d.nama_paket || "").replace(/"/g, '""')}"`,
      `"${(d.instansi || "").replace(/"/g, '""')}"`,
      `"${(d.kategori || "-").replace(/"/g, '""')}"`,
      d.status || "-",
      `"${(d.pagu || "").replace(/"/g, '""')}"`,
      `"${(d.hps || "").replace(/"/g, '""')}"`,
      d.pagu_num || 0,
      d.hps_num || 0,
      d.durasi_hari !== null && d.durasi_hari !== undefined ? d.durasi_hari : "",
      d.jumlah_reschedule || 0,
      d.is_deleted ? "Ya" : "Tidak",
      // Format ISO: YYYY-MM-DD untuk time series analysis
      d.created_at ? new Date(d.created_at).toISOString().slice(0, 10) : "-",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analisis-tender-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  let filteredData = data.filter(item =>
    item.nama_paket?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.instansi?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showAnomalyOnly) {
    filteredData = filteredData.filter(item => {
      const isDurationAnom = item.durasi_hari !== null && item.durasi_hari !== undefined && item.durasi_hari > 0 && item.durasi_hari < 14;
      const isRescheduleAnom = item.jumlah_reschedule !== undefined && item.jumlah_reschedule > 3;
      const isPaguAnom = item.pagu_num > 0 && item.pagu_num < 10000;
      return isDurationAnom || isRescheduleAnom || isPaguAnom;
    });
  }

  // Data untuk chart instansi
  const instansiChartData = insights?.topInstansi.map(i => ({
    nama: (!i.nama || i.nama === "-") ? "Tidak Diketahui" 
          : i.nama.length > 30 ? i.nama.slice(0, 28) + "…" 
          : i.nama,
    count: i.count,
  })) ?? [];

  // Data untuk chart kategori
  const kategoriChartData = insights?.topKategori.map(k => ({
    nama: (!k.nama || k.nama === "-" || k.nama === "Lainnya") ? "Tidak Dikategorikan"
          : k.nama.length > 22 ? k.nama.slice(0, 20) + "…"
          : k.nama,
    count: k.count,
  })) ?? [];

  // --- Data Chart Deal Harga (Pagu vs Penawaran) ---
  const dealChartData = data
    .filter(d => d.pemenang_harga_num && d.pemenang_harga_num > 0 && d.pagu_num > 0)
    .sort((a, b) => b.pagu_num - a.pagu_num)
    .slice(0, 15)
    .map(d => {
      const dropPct = ((d.pagu_num - (d.pemenang_harga_num || 0)) / d.pagu_num) * 100;
      return {
        nama: d.nama_paket.substring(0, 20) + (d.nama_paket.length > 20 ? "..." : ""),
        pagu: d.pagu_num,
        deal: d.pemenang_harga_num || 0,
        drop: dropPct.toFixed(1) + "%",
        pemenang: d.pemenang_nama,
      };
    });

  // Data untuk pie chart status
  const pieData = insights?.statusBreakdown.map(s => ({
    name: s.status,
    value: s.count,
  })) ?? [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Daftar Analisis</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Data tender pemenang & yang dihapus otomatis — untuk analisis kebiasaan & strategi pengguna.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-[1rem] hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-[1rem] hover:bg-slate-800 transition-colors shadow-sm">
            <Download size={15} /> Ekspor CSV
          </button>
        </div>
      </div>

      {/* ── Navigasi Mode Analisis ── */}
      <div className="flex bg-slate-100 p-1.5 rounded-[1rem] w-fit">
        <button
          onClick={() => setMode("completed")}
          className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === "completed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
        >
          Data Selesai
        </button>
        <button
          onClick={() => setMode("failed")}
          className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === "failed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
        >
          Data Gagal
        </button>
        <button
          onClick={() => setMode("all")}
          className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all ${mode === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
        >
          Semua Data
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-medium">Memuat data analisis...</p>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          {insights && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-slate-100 rounded-xl"><BarChart3 size={18} className="text-slate-600" /></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Data</span>
                </div>
                <div className="text-3xl font-black text-slate-900">{insights.total.toLocaleString("id-ID")}</div>
                <div className="flex gap-2 text-[10px] font-bold mt-1.5">
                  <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Barang: {insights.tipeBreakdown?.barang || 0}</span>
                  <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Jasa: {insights.tipeBreakdown?.jasa || 0}</span>
                </div>
                <div className="text-xs text-slate-400 font-medium mt-1">tender dalam analisis</div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-50 rounded-xl"><Banknote size={18} className="text-green-600" /></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Pagu</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{formatRupiah(Math.round(insights.avgPagu))}</div>
                <div className="text-xs text-slate-400 font-medium mt-1">per tender</div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-50 rounded-xl"><TrendingUp size={18} className="text-blue-600" /></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Nilai</span>
                </div>
                <div className="text-2xl font-black text-slate-900">{formatRupiah(insights.totalNilai)}</div>
                <div className="text-xs text-slate-400 font-medium mt-1">akumulasi semua pagu</div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-amber-50 rounded-xl"><Tag size={18} className="text-amber-600" /></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tender Selesai</span>
                </div>
                {(() => {
                  const selesai = (insights as any).totalSelesai ?? 0;
                  const pct = insights.total > 0 ? Math.round((selesai / insights.total) * 1000) / 10 : 0;
                  return (
                    <>
                      <div className="text-3xl font-black text-slate-900">
                        {pct < 1 && pct > 0 ? "< 1%" : `${pct}%`}
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-1">
                        {selesai.toLocaleString("id-ID")} tender capai tahap akhir
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Rata-rata Rating Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-indigo-50 rounded-xl"><Star className="text-indigo-600 w-4 h-4" /></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rating User</span>
                </div>
                <div className="text-3xl font-black text-slate-900 flex items-center gap-2">
                  {insights.avgRatingOverall ? insights.avgRatingOverall.toFixed(1) : "0.0"} <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
                <div className="text-xs text-slate-400 font-medium mt-1">
                  dari {insights.totalRatedTenders || 0} tender dinilai
                </div>
              </div>
            </div>
          )}

          {/* ── Charts ── */}
          {insights && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Bar Chart: Top Instansi */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Building2 size={16} className="text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Top 5 Instansi</h3>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={instansiChartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nama" width={160} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="count" fill="#1e293b" radius={[0, 6, 6, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart: Distribusi Status */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 size={16} className="text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Distribusi Status</h3>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: any) => [`${value} tender`, name]} />
                    <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase" }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart: Top Kategori */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Tag size={16} className="text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Top 5 Bidang Tender</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={kategoriChartData} margin={{ left: 0, right: 10, top: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="nama" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tag Cloud: Trending Keywords */}
              <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Search size={16} className="text-blue-500" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Top Pencarian</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Minggu Ini</span>
                </div>
                
                <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
                  {(insights as any).topKeywords?.length > 0 ? (
                    (insights as any).topKeywords.map((item: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 hover:border-slate-200 transition-colors cursor-pointer group"
                      >
                        <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors capitalize">{item.keyword}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({item.count})</span>
                        {item.trend === "up" ? (
                          <TrendingUp size={12} className="text-emerald-500" />
                        ) : (
                          <TrendingUp size={12} className="text-rose-500 rotate-180" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic py-2">Belum ada riwayat pencarian pengguna.</div>
                  )}
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Intelijen bisnis: Kata kunci terbanyak yang dicari klien saat mencari tender.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* ── Chart: Analisis Deal Lelang (Pagu vs Harga Penawaran) ── */}
          {dealChartData.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mt-4">
              <div className="flex items-center gap-2 mb-5">
                <Banknote size={16} className="text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Perbandingan Pagu vs Harga Deal (Top 15 Lelang Terbesar)</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={dealChartData} margin={{ left: 20, right: 20, top: 20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="nama" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} />
                  <YAxis yAxisId="left" tickFormatter={(v) => `Rp ${v / 1e9}M`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: "#f8fafc" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xl max-w-xs">
                            <p className="text-xs font-bold text-slate-800 mb-1 leading-tight">{data.nama}</p>
                            <p className="text-[10px] text-slate-500 mb-3"><span className="font-bold">Pemenang:</span> {data.pemenang}</p>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Nilai Pagu:</span>
                              <span className="text-xs font-black text-slate-800">{formatRupiah(data.pagu)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-emerald-600 uppercase">Harga Deal:</span>
                              <span className="text-xs font-black text-emerald-700">{formatRupiah(data.deal)}</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 font-bold">Penurunan (Drop):</span>
                              <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">-{data.drop}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase" }}>{v}</span>} />
                  <Bar yAxisId="left" dataKey="pagu" name="Nilai Pagu" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar yAxisId="left" dataKey="deal" name="Harga Deal (Penawaran)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── Tabel Data ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: "560px" }}>
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Cari nama paket atau instansi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAnomalyOnly(!showAnomalyOnly)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                    showAnomalyOnly 
                      ? "bg-red-50 border-red-200 text-red-600" 
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <AlertTriangle size={14} className={showAnomalyOnly ? "text-red-500" : "text-slate-400"} />
                  {showAnomalyOnly ? "Hanya Anomali" : "Filter Anomali"}
                </button>
                <span className="text-xs font-bold text-slate-400 shrink-0">{filteredData.length} data</span>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {filteredData.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Package size={32} className="opacity-20" />
                  <p className="text-sm">Tidak ada data ditemukan.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-md z-10">
                    <tr>
                      <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Nama Paket & Instansi</th>
                      <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Kategori</th>
                      <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">Nilai Pagu</th>
                      <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">Nilai HPS</th>
                      <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Durasi</th>
                      <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Reschedule</th>
                      <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Rating</th>
                      <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug mb-0.5 flex items-start gap-1.5">
                            {((item.durasi_hari !== null && item.durasi_hari !== undefined && item.durasi_hari > 0 && item.durasi_hari < 14) || 
                              (item.jumlah_reschedule !== undefined && item.jumlah_reschedule > 3) || 
                              (item.pagu_num > 0 && item.pagu_num < 10000)) && (
                              <span title="Terdeteksi Anomali Statistik" className="shrink-0 mt-0.5 flex">
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              </span>
                            )}
                            <span>{item.nama_paket}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium truncate">{item.instansi}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider max-w-[140px] truncate">
                            {item.kategori || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-sm font-black text-slate-800">{formatRupiah(item.pagu_num)}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.pagu || "-"}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-700">{formatRupiah(item.hps_num)}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{item.hps || "-"}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="text-sm font-bold text-slate-800">{item.durasi_hari !== null && item.durasi_hari !== undefined ? `${item.durasi_hari} hr` : "-"}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${item.jumlah_reschedule && item.jumlah_reschedule > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                            {item.jumlah_reschedule || 0}x
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.rating && item.rating > 0 ? (
                            <div className="flex items-center justify-center gap-1 font-bold text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                              {item.rating} <Star className="w-3 h-3 fill-amber-500" />
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[item.status] || "bg-slate-100 text-slate-600"}`}>
                            {item.status || "terhapus"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
