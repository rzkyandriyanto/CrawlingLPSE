"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function InputLinkPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) return router.push("/");
    setUser(JSON.parse(userData));
  }, [router]);

  const handleSimpanLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.startsWith("http"))
      return alert("Masukkan URL yang valid (contoh: https://...)");

    setLoading(true);
    // Sesuai flowchart: Simpan ke database
    const { error } = await supabase
      .from("users")
      .update({ company_url: url }) // Pastikan kolom company_url ada di tabel 'users'
      .eq("id", user.id);

    if (error) {
      alert("Gagal: " + error.message);
      setLoading(false);
    } else {
      alert("Link tersimpan! Sistem akan mulai melakukan crawling.");
      // Hapus user di localStorage agar saat masuk dashboard data terbaru di-fetch ulang
      localStorage.removeItem("user");
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      {/* Background Grid Seleno */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.07) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(circle at center, black 50%, transparent 90%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-white/90 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-200"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Link Perusahaan
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Tempelkan link website untuk proses crawling data produk/jasa.
          </p>
        </div>

        <form onSubmit={handleSimpanLink} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              URL Website
            </label>
            <input
              type="url"
              required
              className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-black outline-none transition-all"
              placeholder="https://perusahaan-anda.com"
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? "Memproses..." : "SIMPAN & SELESAI"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
