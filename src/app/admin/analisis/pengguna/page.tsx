"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search, Loader2, Star, TrendingUp, MapPin, Tag } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line
} from "recharts";
import { toast } from "react-hot-toast";

interface PenggunaInsights {
  kpi: {
    totalUser: number;
    activeUsers: number;
    avgRating: number;
  };
  chartKeyword: { name: string; count: number }[];
  chartMinat: { name: string; count: number }[];
  chartProvinsi: { name: string; count: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
        <p className="font-bold text-slate-800 mb-1">{label}</p>
        <p className="text-slate-600">{payload[0].value} pengguna</p>
      </div>
    );
  }
  return null;
};

export default function AnalisisPenggunaPage() {
  const [data, setData] = useState<PenggunaInsights | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analisis?tipe=pengguna`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast.error("Gagal mengambil data pengguna: " + json.error);
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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Analisis Pengguna</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Data pengguna, minat, wilayah, dan riwayat pencarian.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-2xl"></div>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
            <div className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
          </div>
        </div>
      ) : !data ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200">
          <Users size={32} className="opacity-20" />
          <p className="text-sm font-medium">Belum ada data pengguna.</p>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-xl"><Users size={18} className="text-blue-600" /></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total User</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{data.kpi.totalUser.toLocaleString("id-ID")}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">keseluruhan pengguna terdaftar</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-50 rounded-xl"><TrendingUp size={18} className="text-emerald-600" /></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">User Aktif</span>
              </div>
              <div className="text-3xl font-black text-slate-900">{data.kpi.activeUsers.toLocaleString("id-ID")}</div>
              <div className="text-xs text-slate-400 font-medium mt-1">pengguna aktif bulan ini</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-50 rounded-xl"><Star size={18} className="text-amber-600" /></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Rating</span>
              </div>
              <div className="text-3xl font-black text-slate-900 flex items-center gap-2">
                {data.kpi.avgRating.toFixed(1)} <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">penilaian terhadap aplikasi</div>
            </div>
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Tren Pencarian (Line Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Search size={16} className="text-slate-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Top 10 Pencarian Keyword</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                {data.chartKeyword.length > 0 ? (
                  <LineChart data={data.chartKeyword} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} />
                  </LineChart>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data pencarian</div>
                )}
              </ResponsiveContainer>
            </div>

            {/* Top Bidang Minat (Bar Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Tag size={16} className="text-slate-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Top 10 Bidang Minat</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                {data.chartMinat.length > 0 ? (
                  <BarChart data={data.chartMinat} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data minat</div>
                )}
              </ResponsiveContainer>
            </div>

            {/* Distribusi Provinsi (Bar Chart Horizontal) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <MapPin size={16} className="text-slate-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Distribusi User per Provinsi</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                {data.chartProvinsi.length > 0 ? (
                  <BarChart data={data.chartProvinsi} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data provinsi</div>
                )}
              </ResponsiveContainer>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
