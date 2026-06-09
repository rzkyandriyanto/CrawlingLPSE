"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PROVINSI_INDONESIA, KOTA_INDONESIA, KOTA_PROVINSI_MAP, LocationDropdown } from "@/components/common/LocationDropdown";
import { ImageCarousel } from "@/components/common/ImageCarousel";

const AUTH_IMAGES = [
  "https://images.unsplash.com/photo-1555899434-94d1368aa7af?q=80&w=1080&auto=format&fit=crop", // Urban skyline
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=1080&auto=format&fit=crop", // Modern city
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1080&auto=format&fit=crop", // Architecture
  "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=1080&auto=format&fit=crop", // Infrastructure
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    perusahaan: "",
    email: "",
    kota: "",
    provinsi: "",
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

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Gagal registrasi: " + (data.error || "Kesalahan server"));
        setLoading(false);
        return;
      }

      localStorage.setItem("currentUser", JSON.stringify(data.user));
      router.push("/pilih-bidang");
    } catch (err: any) {
      alert("Gagal registrasi: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)]">
      
      {/* KIRI: BAGIAN FORM REGISTRASI */}
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
          <div className="flex flex-col items-center lg:items-start mb-6">
            <img
              src="/logologo.png"
              alt="Logo Perusahaan"
              className="h-10 sm:h-12 w-auto object-contain mb-4"
            />
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)] text-center lg:text-left">
              Daftar Akun Baru
            </h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Nama Lengkap
              </label>
              <input
                type="text"
                placeholder="Masukkan nama lengkap"
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] focus:ring-2 focus:ring-black outline-none transition text-sm text-[var(--text-primary)] shadow-sm"
                onChange={(e) =>
                  setFormData({ ...formData, perusahaan: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Email
              </label>
              <input
                type="email"
                placeholder="nama@email.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] focus:ring-2 focus:ring-black outline-none transition text-sm text-[var(--text-primary)] shadow-sm"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Kota Perusahaan
                </label>
                <LocationDropdown
                  value={formData.kota}
                  onChange={(val) => {
                    let newProv = formData.provinsi;
                    if (val && KOTA_PROVINSI_MAP[val]) {
                      newProv = KOTA_PROVINSI_MAP[val];
                    }
                    setFormData({ ...formData, kota: val, provinsi: newProv });
                  }}
                  options={KOTA_INDONESIA}
                  placeholder="Pilih kota..."
                  label="kota"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Provinsi
                </label>
                <LocationDropdown
                  value={formData.provinsi}
                  onChange={(val) => setFormData({ ...formData, provinsi: val })}
                  options={PROVINSI_INDONESIA}
                  placeholder="Pilih provinsi..."
                  label="provinsi"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Password
              </label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] focus:ring-2 focus:ring-black outline-none transition text-sm text-[var(--text-primary)] shadow-sm"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-bold py-3.5 mt-2 rounded-xl transition shadow-lg shadow-black/10 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-dashed border-white" />}
              {loading ? "Memproses..." : "DAFTAR & MASUK"}
            </motion.button>
          </form>

          <p className="text-center lg:text-left mt-6 text-sm text-[var(--text-secondary)] font-medium">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-[var(--accent-text)] font-black hover:underline ml-1">
              Login di sini
            </Link>
          </p>
        </motion.div>
      </div>

      {/* KANAN: BAGIAN GAMBAR PEMANDANGAN GUNUNG (Hanya terlihat di Desktop) */}
      <div className="hidden lg:block lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <ImageCarousel images={AUTH_IMAGES} interval={5000} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none" />
        
        <div className="absolute bottom-10 left-10 right-10 text-white z-20 max-w-lg">
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-white/60 mb-3">Pendaftaran Seleno</p>
          <h2 className="text-lg font-light tracking-wide text-white/90 leading-relaxed">
            Bergabung dengan ribuan perusahaan lain yang memantau tender pemerintah dengan mudah.
          </h2>
        </div>
      </div>
    </div>
  );
}
