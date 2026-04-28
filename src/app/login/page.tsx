"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      alert("Email atau Password salah!");
      setLoading(false);
      return;
    }

    localStorage.setItem("currentUser", JSON.stringify(data));
    const tags = Array.isArray(data.tag)
      ? data.tag
      : typeof data.tag === "string" && data.tag.trim().startsWith("[")
        ? JSON.parse(data.tag)
        : [];
    if (!Array.isArray(tags) || tags.length === 0) {
      router.push("/pilih-bidang");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-4 py-6 sm:p-4 overflow-hidden font-sans text-slate-800">
      {/* --- GRID BACKGROUND DENGAN ANIMASI MASUK --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(circle at center, black 50%, transparent 90%)",
        }}
      />

      {/* Card Login dengan Animasi & Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.8,
          delay: 0.2,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative z-10 bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-[1.8rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] w-full max-w-md border border-b-4 border-b-black shadow-2xl flex flex-col"
      >
        {/* Header: Logo & Judul dipadatkan */}
        <div className="flex flex-col items-center mb-5 sm:mb-6">
          <img
            src="/logologo.png"
            alt="Logo Perusahaan"
            className="h-10 sm:h-14 w-auto object-contain mb-2"
          />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Login Perusahaan
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm text-center">
            Masuk untuk memantau bidding terbaru.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
          {/* Input Email */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Email Perusahaan
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition text-sm sm:text-base"
              placeholder="nama@perusahaan.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Input Password */}
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:ring-2 focus:ring-black focus:border-transparent outline-none transition text-sm sm:text-base"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Tombol Login */}
          <motion.button
            whileHover={{ scale: 1.01, backgroundColor: "#1a1a1a" }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-bold py-3.5 sm:py-4 mt-2 rounded-2xl transition shadow-xl shadow-black/10 disabled:opacity-50 text-sm sm:text-base"
          >
            {loading ? "Memverifikasi..." : "MASUK SEKARANG"}
          </motion.button>
        </form>

        <p className="text-center mt-6 sm:mt-8 text-xs sm:text-sm text-slate-500 font-medium">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-black font-bold hover:underline ml-1"
          >
            Daftar di sini
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
