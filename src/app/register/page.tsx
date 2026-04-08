"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    perusahaan: "",
    email: "",
    alamat: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password.length < 6) {
      alert("Password minimal 6 karakter!");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .insert([formData])
      .select();

    if (error) {
      alert("Gagal registrasi: " + error.message);
      setLoading(false);
    } else {
      localStorage.setItem("user", JSON.stringify(data[0]));
      router.push("/pilih-bidang");
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center p-4 overflow-hidden font-sans text-slate-800">
      {/* --- GRID BACKGROUND DENGAN ANIMASI MASUK --- */}
      <motion.div
        // Efek Transisi Masuk untuk Grid (Memudar dari transparan ke 0.07)
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }} // Jauh lebih lambat agar elegan
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

      {/* Card Register dengan Animasi Masuk & Glassmorphism */}
      <motion.div
        // Efek Transisi Masuk untuk Card (Memudar, terangkat, dan membesar sedikit)
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.8,
          delay: 0.2, // Sedikit jeda setelah grid muncul
          ease: [0.22, 1, 0.36, 1], // Cubic Bezier untuk efek "membal" yang halus
        }}
        className="relative z-10 bg-white/90 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] w-full max-w-md border border-b-4 border-b-black shadow-2xl flex flex-col"
      >
        {/* Header: Logo & Judul dipadatkan */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logologo.png"
            alt="Logo Perusahaan"
            className="h-14 w-auto object-contain mb-2"
          />
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Daftar Akun Baru
          </h2>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Nama Perusahaan
            </label>
            <input
              type="text"
              placeholder="Masukkan nama resmi"
              required
              className="w-full p-3 rounded-xl border border-slate-200 bg-white/50 outline-none focus:ring-2 focus:ring-black transition"
              onChange={(e) =>
                setFormData({ ...formData, perusahaan: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Email Perusahaan
            </label>
            <input
              type="email"
              placeholder="nama@perusahaan.com"
              required
              className="w-full p-3 rounded-xl border border-slate-200 bg-white/50 outline-none focus:ring-2 focus:ring-black transition"
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Alamat Lengkap
            </label>
            <input
              type="text"
              placeholder="Kota, Provinsi"
              required
              className="w-full p-3 rounded-xl border border-slate-200 bg-white/50 outline-none focus:ring-2 focus:ring-black transition"
              onChange={(e) =>
                setFormData({ ...formData, alamat: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Minimal 6 karakter"
              required
              className="w-full p-3 rounded-xl border border-slate-200 bg-white/50 outline-none focus:ring-2 focus:ring-black transition"
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01, backgroundColor: "#1a1a1a" }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 mt-2 rounded-2xl font-bold transition shadow-xl shadow-black/10 disabled:opacity-50"
          >
            {loading ? "Sedang Memproses..." : "DAFTAR & MASUK"}
          </motion.button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500 font-medium">
          Sudah punya akun?{" "}
          <Link href="/" className="text-black font-bold hover:underline ml-1">
            Login di sini
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
