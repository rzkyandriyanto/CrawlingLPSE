"use client";
import { useEffect, useState } from "react";
// supabase import removed
import { motion, AnimatePresence } from "framer-motion";
import { Users, Package, ShoppingBag, Activity, ArrowUpRight, TrendingUp, X, Mail, Key, Building, Briefcase } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, jasa: 0, produk: 0, lpseTotal: 0, barang: 0 });
  const [loading, setLoading] = useState(true);
  
  // State untuk Modal Tambah Admin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: "", password: "", perusahaan: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats({ 
            users: data.users || 0, 
            jasa: data.jasa || 0, 
            produk: data.produk || 0,
            lpseTotal: data.lpseTotal || 0,
            barang: data.barang || 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const downloadCSV = async () => {
    try {
      const res = await fetch("/api/admin/data?table=paket_lelang");
      const { data: jasa } = await res.json();
      if (!jasa || jasa.length === 0) {
        toast.error("Tidak ada data untuk didownload.");
        return;
      }

      const headers = ["ID", "Nama Paket", "Instansi", "Pagu", "HPS", "Kategori"];
      const csvContent = [
        headers.join(","),
        ...jasa.map((item: any) => [item.id, `"${item.nama_paket}"`, `"${item.instansi}"`, `"${item.pagu}"`, `"${item.hps}"`, item.kategori].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `laporan_lelang_${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Gagal mendownload CSV:", err);
      toast.error("Terjadi kesalahan saat mengunduh data.");
    }
  };

  const clearCache = () => {
    const currentUser = localStorage.getItem("currentUser");
    localStorage.clear();
    if (currentUser) localStorage.setItem("currentUser", currentUser);
    toast.success("System cache cleared successfully!");
    setTimeout(() => { window.location.reload(); }, 1000);
  };

  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin)
      });
      const data = await res.json();

      setIsSubmitting(false);
      if (!res.ok) {
        toast.error("Gagal menambah admin: " + (data.error || "Kesalahan server"));
      } else {
        toast.success("Admin Baru Berhasil Ditambahkan!");
        setIsModalOpen(false);
        setNewAdmin({ email: "", password: "", perusahaan: "" });
        
        // Refresh stats
        const statsRes = await fetch("/api/admin/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(prev => ({ ...prev, users: statsData.users || 0 }));
        }
      }
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error("Error: " + err.message);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 relative">
      <header className="flex justify-between items-end">
        <div>
          <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full mb-3 inline-block">Overview</span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Dashboard Admin</h1>
          <p className="text-slate-500 mt-1 font-medium">Selamat datang kembali, berikut performa sistem Seleno hari ini.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title="Total Pengguna" value={stats.users} icon={<Users size={24} />} color="from-blue-600 to-indigo-600" subtext="Admin & User" />
        <StatCard title="Total Jasa" value={stats.jasa} icon={<Briefcase size={24} />} color="from-emerald-500 to-teal-600" subtext="Dari Sumber LPSE" />
        <StatCard title="Total Barang" value={(stats.produk || 0) + (stats.barang || 0)} icon={<ShoppingBag size={24} />} color="from-orange-500 to-rose-600" subtext="LPSE & Marketplace" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-900 rounded-2xl text-white"><Activity size={24} /></div>
                <h2 className="text-2xl font-black text-slate-900">Aktivitas Sistem</h2>
              </div>
            </div>
            <div className="space-y-5">
              <ActivityRow label="Database Connection" status="Stable" time="Active Now" />
              <ActivityRow label="Web Scraper Engine" status="Standby" time="Ready" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
           <h3 className="text-xl font-black mb-4">Quick Action</h3>
           <p className="text-slate-400 text-sm mb-8 leading-relaxed">Kelola data secara cepat melalui pintasan di bawah ini.</p>
           <div className="space-y-3">
             <ActionButton label="Tambah Admin Baru" onClick={() => setIsModalOpen(true)} />
             <ActionButton label="Download Report .CSV" onClick={downloadCSV} />
             <ActionButton label="Clear System Cache" onClick={clearCache} isDanger />
           </div>
        </div>
      </div>

      {/* MODAL POPUP TAMBAH ADMIN */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <div>
                     <h2 className="text-xl font-black text-slate-900">Tambah Admin</h2>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Akses Kontrol Penuh</p>
                   </div>
                   <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                     <X size={20} />
                   </button>
                </div>

                <form onSubmit={handleAddAdminSubmit} className="p-8 space-y-5">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input required type="email" placeholder="admin@seleno.id" 
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 outline-none focus:border-black transition-all font-medium text-sm"
                          value={newAdmin.email} onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Password</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input required type="password" placeholder="••••••••" 
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 outline-none focus:border-black transition-all font-medium text-sm"
                          value={newAdmin.password} onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nama Perusahaan/Admin</label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input required type="text" placeholder="Admin Seleno Utama" 
                          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 outline-none focus:border-black transition-all font-medium text-sm"
                          value={newAdmin.perusahaan} onChange={(e) => setNewAdmin({...newAdmin, perusahaan: e.target.value})}
                        />
                      </div>
                   </div>

                   <button disabled={isSubmitting} type="submit" className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                      {isSubmitting ? "Mendaftarkan..." : "Konfirmasi & Tambah Admin"}
                   </button>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon, color, subtext }: { title: string, value: number, icon: any, color: string, subtext: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileHover={{ y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
      <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-black/5`}>{icon}</div>
      <div><p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{title}</p><div className="flex items-end gap-2"><h3 className="text-5xl font-black text-slate-900">{value.toLocaleString()}</h3><span className="text-xs font-bold text-slate-400 mb-2">{subtext}</span></div></div>
    </motion.div>
  );
}

function ActivityRow({ label, status, time }: { label: string, status: string, time: string }) {
  return (
    <div className="flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-colors">
      <div className="flex items-center gap-4"><div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div><span className="font-bold text-slate-700">{label}</span></div>
      <div className="text-right"><p className="text-sm font-black text-slate-900">{status}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{time}</p></div>
    </div>
  );
}

function ActionButton({ label, isDanger, onClick }: { label: string, isDanger?: boolean, onClick?: () => void }) {
  return (<button onClick={onClick} className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all border ${isDanger ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white" : "bg-white/5 border-white/10 text-white hover:bg-white hover:text-black"}`}>{label}</button>);
}
