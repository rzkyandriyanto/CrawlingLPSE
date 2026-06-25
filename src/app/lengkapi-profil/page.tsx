"use client";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Upload, User as UserIcon, FileText, CheckCircle2, Loader2 } from "lucide-react";

type StoredUser = {
  id: string | number;
  avatar_url?: string;
};

export default function LengkapiProfilPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  
  // State PDF Company Profile
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Loading States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (!userData) return router.push("/register");
    const parsed = JSON.parse(userData) as StoredUser;
    setUser(parsed);
  }, [router]);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        toast.error("Company Profile harus berformat PDF!");
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Ukuran PDF maksimal 100MB");
        return;
      }
      setSelectedPdf(file);
    }
  };

  const handleSimpan = async () => {
    if (!user) return;
    setIsUploading(true);

    try {
      // 1. Upload and Extract PDF if exists
      if (selectedPdf) {
        setUploadStatus("Menganalisis Company Profile dengan AI... (Ini butuh beberapa detik)");
        const pdfData = new FormData();
        pdfData.append("cp_file", selectedPdf);
        pdfData.append("userId", String(user.id));

        const resPdf = await fetch("/api/upload-cp", { method: "POST", body: pdfData });
        if (!resPdf.ok) {
          const errData = await resPdf.json();
          throw new Error(errData.error || "Gagal memproses Company Profile");
        }
      }

      toast.success("Profil berhasil disimpan!");
      router.push("/menyiapkan-dashboard");
    } catch (error: any) {
      toast.error(error.message);
      setIsUploading(false);
      setUploadStatus("");
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
          maskImage: "radial-gradient(circle at center, black 50%, transparent 90%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md rounded-[1.8rem] sm:rounded-[2.5rem] border border-[var(--border-primary)] bg-[var(--bg-card)]/90 p-5 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-sm flex flex-col items-center"
      >
        <div className="text-center mb-6">
          <p className="inline-flex items-center rounded-full border border-[var(--border-primary)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-secondary)] mb-3">
            Tahap Terakhir
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Lengkapi Profil
          </h2>
          <p className="text-[var(--text-secondary)] mt-1 text-xs sm:text-sm">
            Tambahkan Company Profile agar AI dapat mencocokkan tender lebih akurat.
          </p>
        </div>

        {/* Upload Company Profile */}
        <div className="w-full mb-8">
          <input 
            type="file" 
            ref={pdfInputRef} 
            onChange={handlePdfChange} 
            accept="application/pdf"
            className="hidden" 
          />
          
          <motion.div
            onClick={() => pdfInputRef.current?.click()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-4 rounded-xl border-2 border-dashed flex items-center gap-4 cursor-pointer transition-all ${
              selectedPdf ? "border-green-500 bg-green-500/5" : "border-[var(--border-primary)] hover:border-[var(--accent)] bg-[var(--bg-input)]"
            }`}
          >
            <div className={`p-3 rounded-lg ${selectedPdf ? "bg-green-500 text-white" : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-primary)]"}`}>
              {selectedPdf ? <CheckCircle2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                {selectedPdf ? selectedPdf.name : "Unggah Company Profile"}
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-tight">
                {selectedPdf 
                  ? "AI akan mengekstrak KBLI & pengalaman proyek" 
                  : "Upload PDF untuk rekomendasi tender otomatis (Maks. 5MB)"}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col gap-3">
          <motion.button
            onClick={handleSimpan}
            disabled={isUploading || !selectedPdf}
            whileHover={!isUploading && selectedPdf ? { y: -1, scale: 1.005 } : {}}
            whileTap={!isUploading && selectedPdf ? { scale: 0.985 } : {}}
            className={`w-full rounded-xl py-3.5 sm:py-4 font-bold text-white transition-all text-sm flex items-center justify-center gap-2 ${
              !selectedPdf ? "bg-slate-300 cursor-not-allowed opacity-70" : "bg-[var(--accent)] shadow-xl shadow-[var(--accent)]/20 hover:bg-[var(--accent-hover)]"
            }`}
          >
            {isUploading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isUploading ? "MEMPROSES..." : "SIMPAN PROFIL & LANJUT"}
          </motion.button>

          {isUploading && uploadStatus && (
            <p className="text-xs text-center font-medium animate-pulse" style={{ color: "var(--accent)" }}>
              {uploadStatus}
            </p>
          )}

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
