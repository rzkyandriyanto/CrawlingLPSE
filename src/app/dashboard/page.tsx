"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
  Search,
  Globe,
  Database,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

export default function DashboardPage() {
  const [isCrawling, setIsCrawling] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    // Jika tidak ada data user, lempar kembali ke login
    if (!userData) return router.push("/");
    setUser(JSON.parse(userData));

    // Simulasi proses crawling selama 5 detik sesuai flowchart
    const timer = setTimeout(() => {
      setIsCrawling(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-white font-sans text-slate-900">
      {/* --- GRID BACKGROUND --- */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* --- SIDEBAR --- */}
      <aside className="relative z-10 w-72 border-r border-slate-200 bg-white/80 backdrop-blur-md p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10 px-2">
          <img src="/logologo.png" alt="Logo" className="h-8 w-auto" />
          <span className="font-black text-xl tracking-tighter"></span>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="flex items-center gap-3 w-full p-4 bg-black text-white rounded-2xl font-bold shadow-lg shadow-black/10 transition-all">
            <LayoutDashboard size={20} /> Dashboard
          </button>
        </nav>

        {/* PROFILE SECTION */}
        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-4">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-bold overflow-hidden border-2 border-white shadow-sm">
              {/* Menampilkan Inisial atau Foto jika ada */}
              {user?.email?.charAt(0).toUpperCase() || "V"}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold truncate">
                {user?.email || "Vendor Seleno"}
              </span>
              <span className="text-[10px] uppercase font-black text-slate-400">
                Mitra Pro
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
          >
            <LogOut size={20} /> Keluar
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="relative z-10 flex-1 p-10 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Dashboard Utama
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Selamat datang kembali, berikut pantauan sistem untuk Anda.
          </p>
        </header>

        {isCrawling ? (
          /* --- TAMPILAN PROSES CRAWLING (Sesuai Flowchart Fase Crawling & Matching) --- */
          <div className="max-w-2xl mx-auto mt-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="absolute inset-0 border-4 border-dashed border-black rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Search className="text-black" size={32} />
                </div>
              </div>

              <h2 className="text-2xl font-black mb-4">
                Sistem Sedang Bekerja
              </h2>
              <div className="space-y-4 text-left max-w-xs mx-auto">
                <LoadingStep
                  icon={<Globe size={16} />}
                  label="Crawling website perusahaan..."
                  active={true}
                />
                <LoadingStep
                  icon={<Database size={16} />}
                  label="Ekstraksi data produk/jasa..."
                  active={true}
                  delay={1}
                />
                <LoadingStep
                  icon={<CheckCircle2 size={16} />}
                  label="Matching dengan kategori bidang..."
                  active={true}
                  delay={2}
                />
              </div>
            </motion.div>
          </div>
        ) : (
          /* --- TAMPILAN HASIL (Dashboard Vendor) --- */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Contoh Card Produk Relevan */}
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:shadow-xl hover:border-black transition-all group">
              <div className="flex justify-between items-start mb-6">
                <span className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {user?.tag?.[0] || "Umum"}
                </span>
                <span className="text-green-500 font-bold text-sm">
                  98% Match
                </span>
              </div>
              <h3 className="text-xl font-black mb-2">
                Pengadaan Alat Infrastruktur IT
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Ditemukan dari analisis landing page layanan teknologi Anda.
              </p>
              <button className="w-full py-3 bg-black text-white rounded-xl font-bold group-hover:bg-slate-800 transition-all">
                Lihat Detail Lelang
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// Komponen Kecil untuk List Progres
function LoadingStep({
  icon,
  label,
  active,
  delay = 0,
}: {
  icon: any;
  label: string;
  active: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center gap-3 font-bold text-sm ${active ? "text-slate-900" : "text-slate-300"}`}
    >
      <div
        className={`p-2 rounded-lg ${active ? "bg-slate-100" : "bg-transparent"}`}
      >
        {icon}
      </div>
      {label}
    </motion.div>
  );
}
