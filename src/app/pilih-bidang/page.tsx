"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const DAFTAR_BIDANG = [
  "Teknologi",
  "Otomotif",
  "Konstruksi",
  "Kesehatan",
  "Logistik",
  "Pangan",
];

// Konfigurasi Animasi Container (Muncul berurutan)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Konfigurasi Animasi Tiap Kartu Bidang
const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

export default function PilihBidangPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Ambil data user dari localStorage saat mount
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) return router.push("/register");
    setUser(JSON.parse(userData));
  }, [router]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSimpan = async () => {
    if (selectedTags.length === 0) return alert("Pilih minimal satu bidang!");

    // 1. Simpan tag bidang ke database
    const { error } = await supabase
      .from("users")
      .update({ tag: selectedTags })
      .eq("id", user.id);

    if (error) {
      alert("Gagal menyimpan: " + error.message);
    } else {
      // 2. Profil bidang tersimpan, lanjut ke halaman input link
      // Jangan hapus localStorage di sini agar data user masih bisa dipakai di halaman berikutnya
      router.push("/input-link");
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* --- THE PERFECT GRID BACKGROUND (0.07 Opacity) --- */}
      <div
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

      {/* Card Utama dengan Efek Glassmorphism Tipis */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 bg-white/90 backdrop-blur-sm p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] w-full max-w-lg border border-slate-200"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Pilih Bidang
          </h2>
          <p className="text-slate-500 mt-2 text-sm">
            Sesuaikan kategori bisnis untuk memfilter tender Anda.
          </p>
        </div>

        {/* Grid Bidang dengan Animasi Stagger */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-3 mb-8"
        >
          {DAFTAR_BIDANG.map((bidang) => {
            const isSelected = selectedTags.includes(bidang);
            return (
              <motion.label
                key={bidang}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center p-4 rounded-2xl cursor-pointer border-2 transition-all duration-200
                  ${
                    isSelected
                      ? "border-black bg-black text-white shadow-lg shadow-black/10"
                      : "border-slate-100 bg-white hover:border-slate-300 text-slate-700"
                  }
                `}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  onChange={() => toggleTag(bidang)}
                />

                {/* Custom Checkbox Bulat */}
                <div
                  className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-white border-white"
                      : "bg-white border-slate-300"
                  }`}
                >
                  {isSelected && (
                    <div className="w-1.5 h-1.5 bg-black rounded-full" />
                  )}
                </div>

                <span className="font-bold text-sm tracking-tight uppercase">
                  {bidang}
                </span>
              </motion.label>
            );
          })}
        </motion.div>

        {/* Tombol Simpan */}
        <button
          onClick={handleSimpan}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98] shadow-black/10"
        >
          SIMPAN & LANJUTKAN
        </button>
      </motion.div>
    </div>
  );
}
