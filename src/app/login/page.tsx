"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageCarousel } from "@/components/common/ImageCarousel";

const AUTH_IMAGES = [
  "https://images.unsplash.com/photo-1555899434-94d1368aa7af?q=80&w=1080&auto=format&fit=crop", // Urban skyline
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1080&auto=format&fit=crop", // Modern city
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1080&auto=format&fit=crop", // Architecture
  "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=1080&auto=format&fit=crop", // Infrastructure
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const { user, error } = await res.json();

      if (!res.ok || error || !user) {
        alert(error || "Email atau Password salah!");
        setLoading(false);
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(user));
      
      const tags = Array.isArray(user.tag)
        ? user.tag
        : typeof user.tag === "string" && user.tag.trim().startsWith("[")
          ? JSON.parse(user.tag)
          : [];

      if (!Array.isArray(tags) || tags.length === 0) {
        router.push("/pilih-bidang");
        return;
      }
      
      router.push("/dashboard");
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
      
      {/* KIRI: BAGIAN FORM LOGIN */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
        {/* Grid Background Halus di area form */}
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-50"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--border-primary) 1px, transparent 1px),
              linear-gradient(to bottom, var(--border-primary) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(circle at center, black 40%, transparent 80%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Header */}
          <div className="flex flex-col items-center lg:items-start mb-8">
            <img
              src="/logologo.png"
              alt="Logo Perusahaan"
              className="h-12 sm:h-14 w-auto object-contain mb-6"
            />
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)] text-center lg:text-left">
              Login Perusahaan
            </h1>
            <p className="text-[var(--text-secondary)] mt-2 text-sm sm:text-base font-medium text-center lg:text-left">
              Masuk untuk memantau bidding terbaru.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Email Perusahaan
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3.5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] focus:ring-2 focus:ring-black outline-none transition text-sm sm:text-base text-[var(--text-primary)] shadow-sm"
                placeholder="nama@perusahaan.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full px-4 py-3.5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-input)] focus:ring-2 focus:ring-[var(--accent)] outline-none transition text-sm sm:text-base text-[var(--text-primary)] shadow-sm"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Tombol Login */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-bold py-4 mt-4 rounded-2xl transition shadow-xl shadow-black/10 disabled:opacity-50 text-sm sm:text-base flex items-center justify-center gap-2"
            >
              {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-dashed border-white" />}
              {loading ? "Memverifikasi..." : "MASUK SEKARANG"}
            </motion.button>
          </form>

          <p className="text-center lg:text-left mt-8 text-sm text-[var(--text-secondary)] font-medium">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-[var(--accent-text)] font-black hover:underline ml-1"
            >
              Daftar di sini
            </Link>
          </p>
        </motion.div>
      </div>

      {/* KANAN: BAGIAN GAMBAR PEMANDANGAN KOTA (Hanya terlihat di Desktop) */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <ImageCarousel images={AUTH_IMAGES} interval={5000} />
        
        {/* Overlay gradient untuk estetika teks */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none" />
        
        <div className="absolute bottom-10 left-10 right-10 text-white z-20 max-w-lg">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/60 mb-3">Seleno Platform</p>
          <h2 className="text-lg font-light tracking-wide text-white/90 leading-relaxed">
            Pantau tender pemerintahan dan peluang bisnis di seluruh Indonesia dalam satu layar.
          </h2>
        </div>
      </div>
    </div>
  );
}
