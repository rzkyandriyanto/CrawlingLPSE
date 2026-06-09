"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Building2,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  Package,
  Layers,
  ShieldCheck,
  Star,
  ExternalLink,
  ChevronRight,
  Info,
  FileDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useDashboard } from "../DashboardContext";
import { useState, useEffect } from "react";

export default function DetailPage() {
  const router = useRouter();
  const { selectedItem, language } = useDashboard();
  const [activeTab, setActiveTab] = useState<"desc" | "company">("desc");

  const isService = selectedItem?.tipe === "Jasa";

  useEffect(() => {
    if (!selectedItem) {
      router.push("/dashboard");
    }
  }, [selectedItem, router]);

  if (!selectedItem) return null;

  const handleWhatsApp = () => {
    const waNumber = (selectedItem.whatsapp || selectedItem.telepon || "1500444").replace(/\D/g, "");
    const message = encodeURIComponent(`Halo ${selectedItem.instansi || selectedItem.nama_perusahaan}, saya tertarik dengan paket lelang "${selectedItem.nama_produk}". Bisa bantu informasikan lebih lanjut?`);
    window.open(`https://wa.me/${waNumber}?text=${message}`, "_blank");
  };

  const handleCall = () => {
    const phone = (selectedItem.telepon || selectedItem.whatsapp || "021").replace(/\D/g, "");
    window.location.href = `tel:${phone}`;
  };

  const handleSearchCompany = () => {
    // Navigasi ke dashboard sambil membawa keyword nama instansi
    router.push(`/dashboard?keyword=${encodeURIComponent(selectedItem.instansi || selectedItem.nama_perusahaan || "")}`);
  };

  const handleExportPDF = () => {
    const originalTitle = document.title;
    document.title = `Laporan_Lelang_${selectedItem.id || "Detail"}`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <main
      className="p-4 sm:p-8 md:p-10 lg:p-12 pb-24 h-full flex-1 overflow-y-auto"
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Breadcrumbs & Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8 no-print">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              {language === "EN" ? "Back to Dashboard" : "Kembali ke Dashboard"}
            </button>
            <ChevronRight size={14} />
            <span className="text-slate-500 font-medium truncate max-w-[100px] sm:max-w-none">
              {selectedItem.kategori}
            </span>
            <ChevronRight size={14} />
            <span className="truncate max-w-[150px] sm:max-w-none" style={{ color: "var(--text-primary)" }}>
              {selectedItem.nama_produk}
            </span>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            nav, aside, button, .no-print, header {
              display: none !important;
            }
            main {
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }
            .max-w-6xl {
              max-width: 100% !important;
              padding: 0 !important;
            }
            /* Menghilangkan padding berlebih agar muat 1 halaman */
            .p-4, .p-6, .sm\\:p-6, .sm\\:p-8, .sm\\:p-10 {
              padding: 8px 12px !important;
            }
            .text-sm {
              font-size: 11px !important;
            }
            .text-2xl {
              font-size: 18px !important;
            }
            .mb-8, .mb-10 {
              margin-bottom: 12px !important;
            }
            /* Memaksa elemen tabel agar lebih rapat */
            .flex-col .flex-row {
              padding-top: 6px !important;
              padding-bottom: 6px !important;
            }
          }

          /* Dark theme overrides for detail page elements */
          .dark .bg-white {
            background-color: var(--bg-card) !important;
          }
          .dark .bg-slate-50 {
            background-color: var(--bg-secondary) !important;
          }
          .dark .bg-slate-50\\/50 {
            background-color: var(--bg-secondary) !important;
          }
          .dark .bg-blue-50 {
            background-color: rgba(94, 106, 210, 0.15) !important;
            color: #a5aaff !important;
          }
          .dark .bg-indigo-50 {
            background-color: rgba(124, 130, 242, 0.15) !important;
            color: #a5aaff !important;
          }
          .dark .border-slate-100 {
            border-color: var(--border-primary) !important;
          }
          .dark .border-slate-200 {
            border-color: var(--border-primary) !important;
          }
          .dark .border-slate-50 {
            border-color: var(--border-subtle) !important;
          }
          .dark .text-slate-900 {
            color: var(--text-primary) !important;
          }
          .dark .text-slate-800 {
            color: var(--text-primary) !important;
          }
          .dark .text-slate-700 {
            color: var(--text-secondary) !important;
          }
          .dark .text-slate-600 {
            color: var(--text-secondary) !important;
          }
          .dark .text-black {
            color: var(--text-primary) !important;
          }
          .dark .prose-slate {
            color: var(--text-secondary) !important;
          }
          .dark .prose-slate h4 {
            color: var(--text-primary) !important;
          }
          .dark .border-l-4.border-black {
            border-left-color: var(--accent) !important;
          }
          .dark .border-b-4.border-black {
            border-bottom-color: var(--accent) !important;
          }
        `}</style>

        {isService && (
          <div className="hidden print:block mb-6 border-b-2 border-black pb-2">
            <h1 className="text-xl font-black uppercase">LAPORAN DETAIL PAKET LELANG - SELENO</h1>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-0.5">
              {selectedItem.nama_produk}
            </p>
            <p className="text-[9px] text-slate-400 mt-1">Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        )}

        {isService ? (
          /* ========================================================
             LAYOUT KHUSUS JASA (LPSE) - TABEL SEDERHANA
             ======================================================== */
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex flex-col">
              {/* Row 1 */}
              <div className="flex flex-col sm:flex-row bg-slate-50 border-b border-slate-100 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">Nama Paket</div>
                <div className="w-full sm:w-3/4 font-bold text-black text-sm uppercase">{selectedItem.nama_produk}</div>
              </div>
              {/* Row 2 */}
              <div className="flex flex-col sm:flex-row bg-white border-b border-slate-100 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">Kode Lelang</div>
                <div className="w-full sm:w-3/4 font-medium text-slate-600 text-sm">{selectedItem.id || "-"}</div>
              </div>
              {/* Row 3 */}
              <div className="flex flex-col sm:flex-row bg-slate-50 border-b border-slate-100 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">Unit</div>
                <div className="w-full sm:w-3/4 font-medium text-slate-600 text-sm">{selectedItem.instansi || "LPSE"}</div>
              </div>
              {/* Row 4 */}
              <div className="flex flex-col sm:flex-row bg-white border-b border-slate-100 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">Satuan Kerja</div>
                <div className="w-full sm:w-3/4 font-medium text-slate-600 text-sm">Bagian Umum</div>
              </div>
              {/* Row 5 */}
              <div className="flex flex-col sm:flex-row bg-slate-50 border-b border-slate-100 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">Pagu</div>
                <div className="w-full sm:w-3/4 font-medium text-slate-600 text-sm">{selectedItem.pagu || "Rp 0"}</div>
              </div>
              {/* Row 6 */}
              <div className="flex flex-col sm:flex-row bg-white border-b border-slate-100 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">HPS</div>
                <div className="w-full sm:w-3/4 font-medium text-slate-600 text-sm">{selectedItem.hps || "Rp 0"}</div>
              </div>
              {/* Row 7 */}
              <div className="flex flex-col sm:flex-row bg-slate-50 border-b border-slate-100 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">Anggaran</div>
                <div className="w-full sm:w-3/4 font-medium text-slate-600 text-sm">APBD 2026</div>
              </div>
              {/* Row 8 */}
              <div className="flex flex-col sm:flex-row bg-white border-b border-slate-100 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">Kategori</div>
                <div className="w-full sm:w-3/4 font-medium text-slate-600 text-sm">{selectedItem.kategori || "Pekerjaan Konstruksi"}</div>
              </div>
              {/* Row 9 */}
              <div className="flex flex-col sm:flex-row bg-slate-50 border-b border-slate-100 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">Tahap Saat Ini</div>
                <div className="w-full sm:w-3/4 font-medium text-slate-600 text-sm">{selectedItem.metode_pengadaan || "Tender Sudah Selesai"}</div>
              </div>
              {/* Row 10 */}
              <div className="flex flex-col sm:flex-row bg-white border-b border-slate-100 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">Tanggal</div>
                <div className="w-full sm:w-3/4 font-medium text-slate-600 text-sm">{selectedItem.tanggal || "-"}</div>
              </div>
              {/* Row 11 */}
              <div className="flex flex-col sm:flex-row bg-slate-50 border-b border-slate-100 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">Lokasi Pekerjaan</div>
                <div className="w-full sm:w-3/4 font-medium text-slate-600 text-sm">{selectedItem.wilayah || "Indonesia"}</div>
              </div>
              {/* Row 12 */}
              <div className="flex flex-col sm:flex-row bg-white border-b border-slate-100 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">Jadwal</div>
                <div className="w-full sm:w-3/4 text-sm">
                  {selectedItem.url_lpse && selectedItem.lelangId ? (
                    <a
                      href={`${selectedItem.url_lpse.endsWith('/') ? selectedItem.url_lpse.slice(0, -1) : selectedItem.url_lpse}/lelang/${selectedItem.lelangId}/pengumumanlelang`}
                      target="_blank"
                      rel="noopener"
                      className="font-black text-purple-600 flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink size={14} /> Lihat di LPSE
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Tidak tersedia</span>
                  )}
                </div>
              </div>
              {/* Row 13 */}
              <div className="flex flex-col sm:flex-row bg-slate-50 p-4 sm:p-6">
                <div className="w-full sm:w-1/4 font-black text-slate-700 text-sm mb-1 sm:mb-0">Sumber</div>
                <div className="w-full sm:w-3/4 text-sm">
                  {selectedItem.url_lpse && selectedItem.lelangId ? (
                    <a
                      href={`${selectedItem.url_lpse.endsWith('/') ? selectedItem.url_lpse.slice(0, -1) : selectedItem.url_lpse}/lelang/${selectedItem.lelangId}/pengumumanlelang`}
                      target="_blank"
                      rel="noopener"
                      className="font-black text-purple-600 flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink size={14} /> Buka Pengumuman Lelang di LPSE
                    </a>
                  ) : selectedItem.url_lpse ? (
                    <a
                      href={selectedItem.url_lpse}
                      target="_blank"
                      rel="noopener"
                      className="font-black text-purple-600 flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink size={14} /> Buka Portal LPSE
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Tidak tersedia</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons at the Bottom */}
            <div className="p-6 sm:p-8 bg-slate-50/50 border-t border-slate-100 flex justify-center no-print">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-8 py-4 bg-black text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                <FileDown size={20} />
                {language === 'EN' ? 'Export this Detail to PDF' : 'Ekspor Detail ini ke PDF'}
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
             LAYOUT KHUSUS PRODUK - KARTU KOMPLEKS DENGAN SIDEBAR
             ======================================================== */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10">

            {/* LEFT & CENTER: Product Info */}
            <div className="lg:col-span-2 flex flex-col gap-6 sm:gap-8">

              {/* Main Info Card */}
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 border-2 border-slate-100 shadow-sm">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Package size={20} className="text-orange-500" />
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      {language === "EN" ? "Product" : selectedItem.kategori}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black leading-tight">
                    {selectedItem.nama_produk}
                  </h1>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 sm:mt-4 border-t border-slate-50 pt-6 sm:pt-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{language === "EN" ? "Location" : "Lokasi"}</p>
                        <p className="text-sm sm:text-base font-black">{selectedItem.wilayah || "Indonesia"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{language === "EN" ? "Last Update" : "Update Terakhir"}</p>
                        <p className="text-sm sm:text-base font-black">{selectedItem.tanggal || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 p-6 sm:p-8 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{language === "EN" ? "Budget Ceiling (Pagu)" : "Nilai Pagu Paket"}</p>
                      <h2 className="text-2xl sm:text-3xl font-black text-green-600">{selectedItem.pagu || "Rp 0"}</h2>
                    </div>
                    <div className="flex flex-col sm:items-end">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{language === "EN" ? "Estimated Value (HPS)" : "Nilai HPS Paket"}</p>
                      <p className="text-lg font-black text-slate-600">{selectedItem.hps || "-"}</p>
                    </div>
                  </div>

                  {/* Share Buttons */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{language === "EN" ? "Share via:" : "Bagikan:"}</p>
                    <div className="flex gap-2">
                      <button className="p-2 sm:p-2.5 bg-[#25D366] text-white rounded-xl shadow-lg shadow-green-200 hover:scale-105 transition-transform"><MessageCircle size={18} /></button>
                      <button className="p-2 sm:p-2.5 bg-[#1877F2] text-white rounded-xl shadow-lg shadow-blue-200 hover:scale-105 transition-transform"><Share2 size={18} /></button>
                      <button className="p-2 sm:p-2.5 bg-black text-white rounded-xl shadow-lg shadow-slate-200 hover:scale-105 transition-transform"><ArrowLeft size={18} className="rotate-180" /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description & Tabs Section */}
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-100 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("desc")}
                    className={`px-6 sm:px-10 py-5 sm:py-6 text-sm sm:text-base font-black transition-all border-b-4 whitespace-nowrap ${activeTab === "desc" ? "border-black text-black" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                  >
                    {language === "EN" ? "Product Description" : "Deskripsi Produk"}
                  </button>
                  <button
                    onClick={() => setActiveTab("company")}
                    className={`px-6 sm:px-10 py-5 sm:py-6 text-sm sm:text-base font-black transition-all border-b-4 whitespace-nowrap ${activeTab === "company" ? "border-black text-black" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                  >
                    {language === "EN" ? "Vendor Details" : "Informasi Vendor"}
                  </button>
                </div>
                <div className="p-6 sm:p-10">
                  <AnimatePresence mode="wait">
                    {activeTab === "desc" ? (
                      <motion.div
                        key="desc-tab"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="prose prose-slate max-w-none"
                      >
                        <h4 className="text-lg font-black mb-4 flex items-center gap-2">
                          <Info size={20} className="text-black" />
                          {language === "EN" ? "Overview & Specifications" : "Ikhtisar & Spesifikasi"}
                        </h4>
                        <p className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                          {selectedItem.deskripsi}
                        </p>
                        <div className="mt-8 p-6 bg-slate-50 rounded-2xl border-l-4 border-black">
                          <p className="text-sm font-bold italic text-slate-500">
                            {language === "EN" ? "*Prices and availability may vary based on location and real-time inventory." : "*Harga dan ketersediaan dapat bervariasi tergantung lokasi dan stok aktual."}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="company-tab"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                      >
                        <h4 className="text-lg font-black mb-4 flex items-center gap-2">
                          <Building2 size={20} className="text-black" />
                          {language === "EN" ? "Vendor Information" : "Informasi Perusahaan"}
                        </h4>
                        <p className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line mb-6">
                          {language === "EN" ? "This product is supplied by a verified vendor." : "Produk ini disuplai oleh vendor yang terdaftar dan terverifikasi."}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Company Name" : "Nama Perusahaan"}</p>
                            <p className="text-sm font-bold">{selectedItem.instansi || selectedItem.nama_perusahaan}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Location" : "Lokasi"}</p>
                            <p className="text-sm font-bold">{selectedItem.wilayah || "Indonesia"}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* RIGHT: Sidebar Company Profile */}
            <div className="flex flex-col gap-6 sm:gap-8">

              {/* Contact Card */}
              <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border-2 border-slate-100 shadow-md sticky top-4">
                <div className="flex flex-col items-center text-center mb-8">
                  <button
                    onClick={handleSearchCompany}
                    className="group cursor-pointer"
                  >
                    <h3 className="text-lg sm:text-xl font-black leading-tight group-hover:text-blue-600 transition-colors">
                      {selectedItem.instansi || selectedItem.nama_perusahaan}
                    </h3>
                    <p className="text-xs font-bold text-green-600 flex items-center justify-center gap-1 mt-1">
                      {language === "EN" ? "Verified Vendor" : "Vendor Terverifikasi"} <ShieldCheck size={14} fill="currentColor" className="text-green-600" />
                    </p>
                  </button>

                  <div className="flex items-center gap-1 mt-3 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full">
                    <Star size={12} fill="currentColor" className="text-blue-400" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedItem.kategori || "B2B"}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:gap-4">
                  <button
                    onClick={handleWhatsApp}
                    className="w-full py-3 sm:py-4 bg-[#25D366] text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-green-100 hover:bg-[#1ebe57] transition-all"
                  >
                    <MessageCircle size={20} fill="currentColor" />
                    WhatsApp
                  </button>
                  <button
                    onClick={handleCall}
                    className="w-full py-3 sm:py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                  >
                    <Phone size={20} fill="currentColor" />
                    {language === "EN" ? "Call Center" : "Hubungi"}
                  </button>

                  <div className="mt-4 pt-6 border-t border-slate-50 flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                        <Mail size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === "EN" ? "Email Inquiry" : "Kirim Email"}</p>
                        <p className="text-xs font-bold break-all">{selectedItem.email || `sales@${selectedItem.nama_perusahaan?.toLowerCase().replace(/\s+/g, '') || "vendor"}.id`}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </main>
  );
}
