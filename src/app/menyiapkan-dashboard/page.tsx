"use client";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MenyiapkanDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const t = window.setTimeout(() => router.push("/dashboard"), 2400);
    return () => window.clearTimeout(t);
  }, [router]);

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
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-lg rounded-[1.5rem] sm:rounded-[2.2rem] border border-slate-200 bg-white/90 p-6 sm:p-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
          className="mx-auto mb-4 sm:mb-6 h-12 w-12 sm:h-16 sm:w-16 rounded-full border-4 border-dashed border-black"
        />
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
          Menyiapkan Dashboard
        </h1>
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-slate-500">
          Sistem sedang menyesuaikan produk dan jasa berdasarkan bidang yang Anda
          pilih.
        </p>
      </motion.div>
    </div>
  );
}

