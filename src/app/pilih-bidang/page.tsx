"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type StoredUser = {
  id: string | number;
};

const DAFTAR_BIDANG = [
  "Teknologi",
  "Otomotif",
  "Konstruksi",
  "Kesehatan",
  "Logistik",
  "Pangan",
];

export default function PilihBidangPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [user, setUser] = useState<StoredUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (!userData) return router.push("/register");
    setUser(JSON.parse(userData) as StoredUser);
  }, [router]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSimpan = async () => {
    if (selectedTags.length === 0) return alert("Pilih minimal satu bidang!");
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({ tag: selectedTags })
      .eq("id", user.id);

    if (error) {
      alert("Gagal menyimpan: " + error.message);
      return;
    }

    const old = localStorage.getItem("currentUser");
    const oldUser = old ? JSON.parse(old) : {};
    localStorage.setItem("currentUser", JSON.stringify({ ...oldUser, tag: selectedTags }));
    router.push("/menyiapkan-dashboard");
  };

  return (
    <div className="relative min-h-screen bg-white flex items-center justify-center px-4 py-6 sm:p-4 overflow-hidden font-sans">
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

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl rounded-[1.8rem] sm:rounded-[2.5rem] border border-slate-200 bg-white/90 p-5 sm:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm"
      >
        <div className="text-center mb-5 sm:mb-8">
          <p className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-3 sm:mb-4">
            Personalisasi Preferensi
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Pilih Bidang
          </h2>
          <p className="text-slate-500 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
            Pilihan bidang ini dipakai untuk membatasi hasil produk dan jasa.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-6 sm:mb-8">
          {DAFTAR_BIDANG.map((bidang) => {
            const isSelected = selectedTags.includes(bidang);
            return (
              <motion.button
                key={bidang}
                type="button"
                onClick={() => toggleTag(bidang)}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                layout
                className={`
                  relative overflow-hidden rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 text-left transition-all duration-300
                  ${
                    isSelected
                      ? "border-black bg-black text-white shadow-xl shadow-black/20"
                      : "border-slate-100 bg-white hover:border-slate-300 text-slate-700"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold tracking-tight text-sm sm:text-base">{bidang}</span>
                  <motion.span
                    animate={{
                      scale: isSelected ? 1 : 0.85,
                      opacity: isSelected ? 1 : 0.35,
                    }}
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? "border-white bg-white/15" : "border-slate-300"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isSelected ? "bg-white" : "bg-slate-300"
                      }`}
                    />
                  </motion.span>
                </div>
                <p
                  className={`mt-2 text-xs ${
                    isSelected ? "text-white/80" : "text-slate-400"
                  }`}
                >
                  Fokuskan rekomendasi sesuai bidang ini.
                </p>
              </motion.button>
            );
          })}
        </div>

        <motion.button
          onClick={handleSimpan}
          whileHover={{ y: -1, scale: 1.005 }}
          whileTap={{ scale: 0.985 }}
          className="w-full rounded-2xl bg-black py-3.5 sm:py-4 font-bold text-white shadow-xl shadow-black/20 transition-all hover:bg-slate-800 text-sm sm:text-base"
        >
          {selectedTags.length > 0
            ? `SIMPAN ${selectedTags.length} BIDANG & LANJUTKAN`
            : "SIMPAN & LANJUTKAN"}
        </motion.button>
      </motion.div>
    </div>
  );
}

