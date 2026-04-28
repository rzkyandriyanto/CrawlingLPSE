"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Search, BarChart3, Database, ShieldCheck, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Lenis from "lenis";

// Komponen pembantu untuk animasi per-kata
const Word = ({ children, progress, range }: { children: string, progress: any, range: [number, number] }) => {
  const color = useTransform(progress, range, ["#cbd5e1", "#000000"]);
  return (
    <motion.span style={{ color }} className="inline-block mr-[0.2em]">
      {children}
    </motion.span>
  );
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const textRevealRef = useRef<HTMLHeadingElement>(null);

  const { scrollYProgress: textRevealProgress } = useScroll({
    target: textRevealRef,
    offset: ["start 80%", "end 50%"]
  });

  const textToReveal = "Pengadaan B2B Anda butuh lebih dari cara manual. Platform usang membuat Anda lambat dan tertinggal. Seleno memberi Anda kecepatan, presisi, dan analitik otomatis. Intelijen data yang akhirnya bekerja untuk Anda.";
  const words = textToReveal.split(" ");

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const { scrollY } = useScroll();
  const backgroundY = useTransform(scrollY, [0, 1000], ["0%", "50%"]);
  const opacityText = useTransform(scrollY, [0, 300], [1, 0]);
  const heroText1X = useTransform(scrollY, [0, 800], [0, -80]);
  const heroText2X = useTransform(scrollY, [0, 800], [0, 80]);

  return (
    <div className="relative min-h-screen text-white font-sans bg-[#0a0a0a]">

      {/* Background Image Parallax */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          className="w-full h-[120%] bg-cover bg-center"
          style={{
            backgroundImage: "url('/Landing1.jpg')",
            y: backgroundY
          }}
        />
        <div className="absolute inset-0 bg-black/60 backdrop-brightness-75" />
      </div>

      {/* ─── Pill Navbar ─── */}
      <nav className="fixed top-4 sm:top-6 left-0 right-0 z-[100] flex justify-center px-3 sm:px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white text-black rounded-[2rem] px-4 py-2.5 sm:px-6 sm:py-3 flex items-center justify-between w-full max-w-5xl shadow-2xl border border-black/5"
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 overflow-hidden flex items-center justify-start relative rounded-full flex-shrink-0">
              <img
                src="/logologo.png"
                alt="Seleno Logo"
                className="absolute left-0 h-full w-auto max-w-none object-cover object-left scale-[1.35] origin-left"
              />
            </div>
            <span className="text-lg font-black tracking-tight">Seleno</span>
          </div>

          {/* Center Links – hidden on mobile */}
          <div className="hidden md:flex items-center gap-8 font-bold text-sm text-slate-600">
            <Link href="#" className="hover:text-black transition-colors">Produk</Link>
            <Link href="#" className="hover:text-black transition-colors">Lelang LPSE</Link>
            <Link href="#" className="hover:text-black transition-colors">Tentang Kami</Link>
          </div>

          {/* Right: Desktop buttons + Mobile Hamburger */}
          <div className="flex items-center gap-2">
            {/* Desktop: two buttons */}
            <Link
              href="/login"
              className="hidden sm:inline-block border border-black/20 text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-slate-100 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="hidden sm:inline-block bg-black text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              Daftar
            </Link>

            {/* Hamburger – mobile only */}
            <button
              className="sm:hidden p-2 rounded-full bg-black text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </motion.div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-[calc(100%+8px)] left-3 right-3 bg-white rounded-2xl shadow-2xl p-5 flex flex-col gap-3 border border-black/5"
          >
            <Link href="#" onClick={() => setMobileMenuOpen(false)} className="font-bold text-black py-2 border-b border-slate-100">Produk</Link>
            <Link href="#" onClick={() => setMobileMenuOpen(false)} className="font-bold text-black py-2 border-b border-slate-100">Lelang LPSE</Link>
            <Link href="#" onClick={() => setMobileMenuOpen(false)} className="font-bold text-black py-2 border-b border-slate-100">Tentang Kami</Link>
            <div className="flex gap-2 mt-1">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 border border-black/20 text-black px-4 py-3 rounded-full font-bold text-sm text-center hover:bg-slate-100"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 bg-black text-white px-4 py-3 rounded-full font-bold text-sm text-center hover:bg-slate-800"
              >
                Daftar
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <main className="relative z-10 h-screen flex flex-col items-center justify-center px-4 text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col items-center w-full"
        >
          {/* Top Line with Strikethrough */}
          <div className="relative w-full max-w-[95vw]">
            <h1 className="text-[clamp(2rem,8vw,110px)] font-black tracking-tighter leading-none relative z-10 drop-shadow-xl text-center">
              Tanpa Repot. Tanpa Manual.
            </h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.8, ease: "easeInOut" }}
              className="absolute top-1/2 left-0 right-0 h-[6px] sm:h-3 md:h-4 lg:h-5 bg-[#00d4ff] z-20 origin-left"
              style={{ top: "50%", transform: "translateY(-50%)" }}
            />
          </div>

          {/* Bottom Line */}
          <h1 className="text-[clamp(2rem,8vw,110px)] font-black tracking-tighter leading-none mt-2 sm:mt-4 drop-shadow-xl text-center">
            Cukup Seleno.
          </h1>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className="mt-8 sm:mt-12"
          >
            <Link
              href="/register"
              className="bg-[#00d4ff] text-black font-black px-7 py-3.5 sm:px-10 sm:py-5 rounded-2xl hover:bg-[#00bfe6] text-sm sm:text-lg tracking-wide inline-block"
            >
              Mulai Eksplorasi
            </Link>
          </motion.div>
        </motion.div>

        {/* Bottom Left Description – hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ opacity: opacityText }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="absolute bottom-10 left-6 sm:bottom-12 sm:left-12 text-left max-w-xs sm:max-w-md hidden sm:block"
        >
          <p className="font-bold text-sm sm:text-lg leading-relaxed text-white drop-shadow-lg">
            Ekspor langsung ke laporan Anda. <br />
            Semua terpusat dalam satu Web App.
          </p>
        </motion.div>
      </main>

      {/* ─── White Typography Section ─── */}
      <section className="relative z-20 w-full bg-white text-black py-20 sm:py-32 px-5 sm:px-10 flex flex-col items-center justify-center text-center">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 sm:mb-12 flex items-center justify-center"
        >
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-100 rounded-full flex items-center justify-center shadow-inner border border-slate-200">
            <Database className="text-slate-400 w-8 h-8 sm:w-12 sm:h-12" />
          </div>
        </motion.div>

        {/* Scroll-reveal text */}
        <motion.div className="max-w-5xl mx-auto">
          <h2 ref={textRevealRef} className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.3] flex flex-wrap justify-center">
            {words.map((word, i) => {
              const start = i / words.length;
              const end = start + (1 / words.length);
              return (
                <Word key={i} progress={textRevealProgress} range={[start, end]}>
                  {word}
                </Word>
              );
            })}
          </h2>
        </motion.div>
      </section>

      {/* ─── Advantages Section ─── */}
      <section className="relative z-10 w-full bg-white px-5 sm:px-10 pb-24 sm:pb-32 overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.25] z-0"
          style={{
            backgroundImage: `linear-gradient(to right, #00d4ff 1px, transparent 1px), linear-gradient(to bottom, #00d4ff 1px, transparent 1px)`,
            backgroundSize: "48px 48px"
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-14 sm:mb-20"
          >
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black text-black tracking-tighter leading-tight max-w-3xl">
              Seperti Crawler Biasa,<br />Tapi Jauh Lebih Cerdas.
            </h2>
          </motion.div>

          {/* 2×2 on mobile/tablet, 4 cols on lg */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 lg:gap-8">
            {[
              { icon: <Database size={20} strokeWidth={2.5} />, title: "Agregasi Data Masif", desc: "Mesin crawler kami mengekstrak ribuan data B2B dan lelang setiap hari." },
              { icon: <Search size={20} strokeWidth={2.5} />, title: "Pencarian Instan", desc: "Temukan spesifikasi produk atau nilai pagu tanpa delay rendering." },
              { icon: <ShieldCheck size={20} strokeWidth={2.5} />, title: "Vendor Terverifikasi", desc: "Data ditarik langsung dari sumber terpercaya seperti LPSE & Indonetwork." },
              { icon: <BarChart3 size={20} strokeWidth={2.5} />, title: "Siap Cetak Laporan", desc: "Ekspor rincian teknis ke PDF profesional hanya dengan satu klik." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex flex-col items-start"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                  <span className="text-black">{item.icon}</span>
                </div>
                <h3 className="text-base sm:text-xl lg:text-2xl font-black text-black mb-2 sm:mb-3 leading-snug">{item.title}</h3>
                <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cyan CTA Card ─── */}
      <section className="relative z-10 w-full bg-white px-4 sm:px-6 pb-16 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-7xl mx-auto bg-[#00d4ff] rounded-[2rem] sm:rounded-[3rem] py-20 sm:py-32 md:py-40 px-6 sm:px-12 flex flex-col items-center justify-center text-center relative overflow-hidden"
        >
          {/* Decorative icons */}
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 text-black/10 hidden lg:block rotate-12">
            <Database size={240} strokeWidth={1} />
          </div>
          <div className="absolute -right-10 top-1/2 -translate-y-1/2 text-black/10 hidden lg:block -rotate-12">
            <BarChart3 size={240} strokeWidth={1} />
          </div>

          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[90px] font-black text-black tracking-tighter leading-none mb-6 sm:mb-8 relative z-10">
            Bergabung di Seleno,<br />Tumbuh Bersama
          </h2>
          <p className="text-black/80 font-bold text-base sm:text-xl md:text-2xl mb-8 sm:mb-12 max-w-2xl relative z-10">
            Akses jutaan data komersial dan pantau pemenang tender secara instan. Buat akun Anda sekarang juga.
          </p>

          <Link
            href="/register"
            className="bg-white text-black font-black px-8 py-4 sm:px-12 sm:py-6 rounded-2xl sm:rounded-3xl hover:bg-slate-100 text-base sm:text-xl tracking-wide inline-block relative z-10 shadow-2xl transition-colors"
          >
            Buat Akun Sekarang
          </Link>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 bg-white border-t border-slate-200 py-10 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Seleno Projek. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-black transition-colors">Kebijakan Privasi</Link>
            <Link href="#" className="hover:text-black transition-colors">Syarat & Ketentuan</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
