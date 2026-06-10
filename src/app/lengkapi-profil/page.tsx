"use client";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Upload, User as UserIcon } from "lucide-react";

type StoredUser = {
  id: string | number;
  avatar_url?: string;
};

export default function LengkapiProfilPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (!userData) return router.push("/register");
    const parsed = JSON.parse(userData) as StoredUser;
    setUser(parsed);
    if (parsed.avatar_url && !parsed.avatar_url.includes("default-avatar")) {
      setPreviewUrl(parsed.avatar_url);
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        toast.error("Hanya format JPG, JPEG, dan PNG yang diperbolehkan!");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran maksimal file adalah 2MB!");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSimpan = async () => {
    if (!selectedFile) {
      toast.error("Silakan pilih foto terlebih dahulu!");
      return;
    }
    if (!user) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", selectedFile);
      formData.append("userId", String(user.id));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error("Gagal mengunggah: " + (errorData.error || "Kesalahan server"));
        return;
      }

      const data = await res.json();
      
      // Update local storage
      const old = localStorage.getItem("currentUser");
      const oldUser = old ? JSON.parse(old) : {};
      localStorage.setItem("currentUser", JSON.stringify({ ...oldUser, avatar_url: data.avatar_url }));
      
      toast.success("Foto profil berhasil diperbarui!");
      router.push("/menyiapkan-dashboard");
    } catch (error: any) {
      toast.error("Gagal mengunggah foto: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLewati = () => {
    router.push("/menyiapkan-dashboard");
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] flex items-center justify-center px-4 py-6 sm:p-4 overflow-hidden font-sans">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--border-primary) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border-primary) 1px, transparent 1px)
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
        className="relative z-10 w-full max-w-md rounded-[1.8rem] sm:rounded-[2.5rem] border border-[var(--border-primary)] bg-[var(--bg-card)]/90 p-5 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-sm flex flex-col items-center"
      >
        <div className="text-center mb-6 sm:mb-8">
          <p className="inline-flex items-center rounded-full border border-[var(--border-primary)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-3 sm:mb-4">
            Tahap Terakhir
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Lengkapi Profil
          </h2>
          <p className="text-[var(--text-secondary)] mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
            Tambahkan foto profil agar akun Anda terlihat lebih personal.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center mb-8 w-full">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/jpeg, image/jpg, image/png"
            className="hidden" 
          />
          
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-dashed overflow-hidden flex items-center justify-center shadow-lg transition-all"
            style={{ 
              borderColor: previewUrl ? "var(--accent)" : "var(--border-primary)",
              backgroundColor: "var(--bg-input)"
            }}
          >
            {previewUrl ? (
              <>
                <img 
                  src={previewUrl} 
                  alt="Preview Avatar" 
                  className="w-full h-full object-cover"
                  onError={() => setPreviewUrl(null)}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="text-white w-8 h-8" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                <UserIcon className="w-10 h-10 sm:w-12 sm:h-12" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Pilih Foto</span>
              </div>
            )}
          </motion.button>
          
          <p className="text-[10px] text-[var(--text-muted)] mt-4 font-medium uppercase tracking-wider text-center">
            Maks. 2MB (JPEG/PNG)
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <motion.button
            onClick={handleSimpan}
            disabled={isUploading || !selectedFile}
            whileHover={!isUploading && selectedFile ? { y: -1, scale: 1.005 } : {}}
            whileTap={!isUploading && selectedFile ? { scale: 0.985 } : {}}
            className={`w-full rounded-xl py-3.5 sm:py-4 font-bold text-white transition-all text-sm sm:text-base flex items-center justify-center gap-2 ${
              !selectedFile ? "bg-slate-300 cursor-not-allowed opacity-70" : "bg-[var(--accent)] shadow-xl shadow-[var(--accent)]/20 hover:bg-[var(--accent-hover)]"
            }`}
          >
            {isUploading && (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {isUploading ? "MENGUNGGAH..." : "SIMPAN FOTO"}
          </motion.button>

          <button
            onClick={handleLewati}
            disabled={isUploading}
            className="w-full rounded-xl py-3 text-sm font-bold transition-colors hover:bg-slate-100 disabled:opacity-50"
            style={{ color: "var(--text-secondary)" }}
          >
            LEWATI (SKIP)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
