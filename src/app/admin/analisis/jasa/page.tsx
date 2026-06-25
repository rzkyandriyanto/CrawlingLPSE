"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Loader2, Briefcase, Banknote, Building2, BarChart3, TrendingUp, Trophy } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { toast } from "react-hot-toast";

interface JasaInsights {
  kpi: {
    totalTender: number;
    totalNilaiPagu: number;
    avgPagu: number;
    jumlahInstansi: number;
  };
  chartInstansi: { nama: string; totalPagu: number; count: number }[];
  chartStatus: { status: string; count: number }[];
  chartTren: { name: string; count: number }[];
  chartWinRate: { wilayah: string; winRate: number; total: number; menang: number }[];
  tabel: { id: string; nama_paket: string; instansi: string; pagu: string; pagu_num: number; status: string; wilayah: string }[];
}

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

function formatRupiahSingkat(num: number): string {
  if (!num || num === 0) return "Rp 0";
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')} M`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')} Jt`;
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)} Rb`;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataKey = payload[0].dataKey;
    let valueStr = `${payload[0].value}`;
    
    if (dataKey === "totalPagu") {
      valueStr = formatRupiahSingkat(payload[0].value);
    } else if (dataKey === "winRate") {
      valueStr = `${payload[0].value}% (Menang ${payload[0].payload.menang} dari ${payload[0].payload.total})`;
    } else {
      valueStr = `${payload[0].value} tender`;
    }

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        <p className="text-slate-600">{valueStr}</p>
      </div>
    );
  }
  return null;
};

export default function AnalisisJasaPage() {
  const [data, setData] = useState<JasaInsights | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analisis?tipe=jasa`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast.error("Gagal mengambil data jasa: " + json.error);
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Analisis Jasa</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Data khusus pengadaan jasa (Konstruksi, Konsultansi, Jasa Umum, Lainnya).
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-2xl"></div>)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="h-64 lg:col-span-2 bg-slate-200 animate-pulse rounded-2xl"></div>
            <div className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
            <div className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
          </div>
        </div>
      ) : !data || data.tabel.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200">
          <Briefcase size={32} className="opacity-20" />
          <p className="text-sm font-medium">Belum ada data pengadaan jasa.</p>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-slate-100 rounded-xl"><Briefcase size={18} className="text-slate-600" /></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tender</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{data.kpi.totalTender.toLocaleString("id-ID")}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">keseluruhan data pengadaan jasa</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-xl"><TrendingUp size={18} className="text-blue-600" /></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pagu</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{formatRupiahSingkat(data.kpi.totalNilaiPagu)}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">akumulasi seluruh tender jasa</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-50 rounded-xl"><Banknote size={18} className="text-emerald-600" /></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Pagu</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{formatRupiahSingkat(data.kpi.avgPagu)}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">per tender pengadaan jasa</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-50 rounded-xl"><Building2 size={18} className="text-amber-600" /></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instansi</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{data.kpi.jumlahInstansi.toLocaleString("id-ID")}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">jumlah entitas penyelenggara</div>
            </div>
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Top Instansi */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Building2 size={16} className="text-slate-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Top 10 Instansi by Pagu</h3>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                {data.chartInstansi.length > 0 ? (
                  <BarChart data={data.chartInstansi} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tickFormatter={(v) => formatRupiahSingkat(v)} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nama" width={160} tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="totalPagu" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data instansi</div>
                )}
              </ResponsiveContainer>
            </div>

            {/* Pie Chart: Distribusi Status */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={16} className="text-slate-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Distribusi Status</h3>
              </div>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={260}>
                  {data.chartStatus.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={data.chartStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="status"
                      >
                        {data.chartStatus.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any, name: any) => [`${value} tender`, name]} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase" }}>{v}</span>} />
                    </PieChart>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data status</div>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Line Chart: Tren per Bulan */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={16} className="text-slate-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Tren Tender Jasa (6 Bulan Terakhir)</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                {data.chartTren.length > 0 ? (
                  <LineChart data={data.chartTren} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} />
                  </LineChart>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada tren per bulan</div>
                )}
              </ResponsiveContainer>
            </div>

            {/* Win Rate per Wilayah */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Trophy size={16} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Win Rate per Wilayah</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                {data.chartWinRate && data.chartWinRate.length > 0 ? (
                  <BarChart data={data.chartWinRate} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="wilayah" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="winRate" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data wilayah</div>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Tabel ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: "560px" }}>
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Briefcase size={16} className="text-slate-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Daftar Tender Jasa (Top 100)</h3>
              </div>
              <div className="text-xs font-bold text-slate-400 shrink-0">{data.tabel.length} data ditayangkan</div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-md z-10">
                  <tr>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Nama Paket & Instansi</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">Nilai Pagu</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Wilayah</th>
                    <th className="py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.tabel.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug mb-0.5">{item.nama_paket}</div>
                        <div className="text-xs text-slate-400 font-medium truncate">{item.instansi || "-"}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-sm font-black text-slate-800">{formatRupiahSingkat(item.pagu_num)}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5" title={item.pagu}>{item.pagu ? (item.pagu.length > 20 ? item.pagu.substring(0,20)+"..." : item.pagu) : "-"}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="text-xs text-slate-500">{item.wilayah || "-"}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600`}>
                          {item.status || "terhapus"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
