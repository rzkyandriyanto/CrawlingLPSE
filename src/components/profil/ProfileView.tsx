"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Camera, Mail, Edit3, Save, XCircle, Tag, MapPin, Building2, Globe, Search, ChevronDown, X } from "lucide-react";
import { StoredUser } from "@/types";
import { useState, useRef, useEffect } from "react";
import { PROVINSI_INDONESIA, KOTA_PROVINSI_MAP, KOTA_INDONESIA, LocationDropdown } from "@/components/common/LocationDropdown";

// ── Tipe Props ────────────────────────────────────────────────────────────────
type ProfileViewProps = {
  user: StoredUser;
  language: "ID" | "EN";
  uploadingFoto: boolean;
  uploadingCp?: boolean;
  isEditingProfile: boolean;
  profileSaving: boolean;
  profileForm: {
    perusahaan: string;
    email: string;
    kota: string;
    provinsi: string;
    website: string;
    tag: string[];
  };
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  pdfInputRef?: React.RefObject<HTMLInputElement | null>;
  onFotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPdfUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveProfile: () => void;
  onFormChange: (field: keyof ProfileViewProps["profileForm"], value: string) => void;
  onToggleProfileTag: (tag: string) => void;
  daftarBidang: string[];
  selectedBidang: string[];
};

export default function ProfileView({
  user,
  language,
  uploadingFoto,
  uploadingCp,
  isEditingProfile,
  profileSaving,
  profileForm,
  fileInputRef,
  pdfInputRef,
  onFotoUpload,
  onPdfUpload,
  onStartEditing,
  onCancelEditing,
  onSaveProfile,
  onFormChange,
  onToggleProfileTag,
  daftarBidang,
  selectedBidang,
}: ProfileViewProps) {
  const cp = user?.company_profile;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* PROFIL PENGGUNA */}
        <div className="rounded-[2rem] border shadow-sm overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 h-32 sm:h-40">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                backgroundSize: "30px 30px",
              }}
            />
          </div>
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            {/* Avatar */}
            <div className="relative -mt-16 sm:-mt-20 mb-5">
              <div className="relative inline-block">
                <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 shadow-xl overflow-hidden" style={{ borderColor: "var(--bg-card)", backgroundColor: "var(--bg-secondary)" }}>
                  {user.foto_url ? (
                    <img src={user.foto_url} alt="Foto Profil" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <User size={48} className="text-slate-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFoto}
                  className="absolute bottom-1 right-1 p-2.5 bg-black text-white rounded-full shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50 border-2"
                  style={{ borderColor: "var(--bg-card)" }}
                  title={language === "EN" ? "Change Photo" : "Ganti Foto"}
                >
                  {uploadingFoto ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-dashed border-white" />
                  ) : (
                    <Camera size={16} />
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFotoUpload} />
              </div>
            </div>

            {/* Name & Email */}
            <div className="mb-6">
              {isEditingProfile ? (
                <div className="space-y-3 max-w-md">
                  <div>
                    <input
                      type="text"
                      value={profileForm.perusahaan}
                      onChange={(e) => onFormChange("perusahaan", e.target.value)}
                      placeholder={language === "EN" ? "Company Name" : "Nama Perusahaan"}
                      className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-base font-bold"
                      style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => onFormChange("email", e.target.value)}
                      placeholder={language === "EN" ? "Email" : "Email"}
                      className="w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm font-semibold"
                      style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                    {user.perusahaan || (language === "EN" ? "Company Name" : "Nama Perusahaan")}
                  </h2>
                  <p className="text-sm font-medium mt-1 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                    <Mail size={14} />{" "}
                    {user.email || (language === "EN" ? "email@company.com" : "email@perusahaan.com")}
                  </p>
                </>
              )}
            </div>

            {/* Action Buttons */}
            {!isEditingProfile ? (
              <button
                onClick={onStartEditing}
                className="mb-8 px-5 py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-black/10 flex items-center gap-2"
                style={{ backgroundColor: "var(--accent)", color: "#ffffff" }}
              >
                <Edit3 size={15} /> {language === "EN" ? "Edit Profile" : "Edit Profil"}
              </button>
            ) : (
              <div className="mb-8 flex gap-2">
                <button
                  onClick={onSaveProfile}
                  disabled={profileSaving}
                  className="px-5 py-2.5 text-white rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {profileSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-dashed border-white" />{" "}
                      {language === "EN" ? "Saving..." : "Menyimpan..."}
                    </>
                  ) : (
                    <>
                      <Save size={15} /> {language === "EN" ? "Save" : "Simpan"}
                    </>
                  )}
                </button>
                <button
                  onClick={onCancelEditing}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all border flex items-center gap-2 hover:bg-[var(--bg-secondary)]"
                  style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
                >
                  <XCircle size={15} /> {language === "EN" ? "Cancel" : "Batal"}
                </button>
              </div>
            )}

            {/* Profile Info Grid */}
            <div className="space-y-5">
              {/* Bidang Usaha */}
              <div className="p-4 sm:p-5 rounded-2xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} style={{ color: "var(--text-muted)" }} />
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    {language === "EN" ? "Business Field" : "Bidang Usaha"}
                  </span>
                </div>
                {isEditingProfile ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {daftarBidang.map((bidang) => {
                      const isSelected = profileForm.tag.includes(bidang);
                      return (
                        <button
                          key={bidang}
                          type="button"
                          onClick={() => onToggleProfileTag(bidang)}
                          className={`px-3 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                            isSelected ? "text-white shadow-lg" : "hover:border-[var(--text-secondary)]"
                          }`}
                          style={
                            isSelected
                              ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)" }
                              : { backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-secondary)" }
                          }
                        >
                          {bidang}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedBidang.length > 0 ? (
                      selectedBidang.map((b) => (
                        <span key={b} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: "var(--accent)" }}>
                          {b}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm italic" style={{ color: "var(--text-muted)" }}>
                        {language === "EN" ? "Not selected" : "Belum dipilih"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Kota & Provinsi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* KOTA */}
                <div className="p-4 sm:p-5 rounded-2xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={16} style={{ color: "var(--text-muted)" }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      {language === "EN" ? "City" : "Kota"}
                    </span>
                  </div>
                  {isEditingProfile ? (
                    <LocationDropdown
                      value={profileForm.kota}
                      onChange={(val) => {
                        onFormChange("kota", val);
                        // Jika ada pemetaan kota -> provinsi, otomatis isi provinsinya
                        if (val && KOTA_PROVINSI_MAP[val]) {
                          onFormChange("provinsi", KOTA_PROVINSI_MAP[val]);
                        }
                      }}
                      options={KOTA_INDONESIA}
                      placeholder={language === "EN" ? "Select city..." : "Pilih kota..."}
                      label="kota"
                    />
                  ) : (
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {user.kota || (
                        <span className="italic" style={{ color: "var(--text-muted)" }}>
                          {language === "EN" ? "Not filled" : "Belum diisi"}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* PROVINSI */}
                <div className="p-4 sm:p-5 rounded-2xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 size={16} style={{ color: "var(--text-muted)" }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      {language === "EN" ? "Province" : "Provinsi"}
                    </span>
                  </div>
                  {isEditingProfile ? (
                    <LocationDropdown
                      value={profileForm.provinsi}
                      onChange={(val) => onFormChange("provinsi", val)}
                      options={PROVINSI_INDONESIA}
                      placeholder={language === "EN" ? "Select province..." : "Pilih provinsi..."}
                      label="provinsi"
                    />
                  ) : (
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {user.provinsi || (
                        <span className="italic" style={{ color: "var(--text-muted)" }}>
                          {language === "EN" ? "Not filled" : "Belum diisi"}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Website */}
              <div className="p-4 sm:p-5 rounded-2xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} style={{ color: "var(--text-muted)" }} />
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    {language === "EN" ? "Company Website" : "Website Perusahaan"}
                  </span>
                </div>
                {isEditingProfile ? (
                  <input
                    type="url"
                    value={profileForm.website}
                    onChange={(e) => onFormChange("website", e.target.value)}
                    placeholder={language === "EN" ? "https://company.com" : "https://perusahaan.com"}
                    className="w-full px-3 py-2.5 rounded-xl border outline-none transition-all text-sm font-semibold"
                    style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}
                  />
                ) : (
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {user.website ? (
                      <a
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center gap-1.5"
                      >
                        {user.website} <Globe size={13} />
                      </a>
                    ) : (
                      <span className="italic" style={{ color: "var(--text-muted)" }}>
                        {language === "EN" ? "Not filled" : "Belum diisi"}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PROFIL PERUSAHAAN (AI Extracted PDF) */}
        <div className="rounded-[2rem] border shadow-sm overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
          <div className="px-6 sm:px-8 py-6 sm:py-8">
            <h2 className="text-xl sm:text-2xl font-black mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              {language === "EN" ? "Company Profile (AI)" : "Profil Perusahaan (AI)"}
            </h2>
            <p className="text-sm font-medium mb-6" style={{ color: "var(--text-secondary)" }}>
              {language === "EN" 
                ? "Upload your Company Profile PDF for advanced AI matching capabilities based on service keywords and financial capacity." 
                : "Unggah PDF Company Profile Anda untuk kemampuan pencocokan AI tingkat lanjut berdasarkan kata kunci layanan dan kapasitas finansial."}
            </p>

            <div className="mb-8">
              <input 
                type="file" 
                ref={pdfInputRef} 
                onChange={onPdfUpload} 
                accept="application/pdf"
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => pdfInputRef?.current?.click()}
                disabled={uploadingCp}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {uploadingCp ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-dashed border-white" />
                    {language === "EN" ? "Extracting..." : "Mengekstrak..."}
                  </>
                ) : (
                  <>
                    <Building2 size={18} /> {language === "EN" ? "Upload Company Profile (PDF)" : "Unggah Company Profile (PDF)"}
                  </>
                )}
              </button>
            </div>

            {cp && (
              <div className="space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={16} style={{ color: "var(--text-muted)" }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      {language === "EN" ? "Service Keywords" : "Kata Kunci Layanan"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {cp.kata_kunci_layanan?.length > 0 ? (
                      cp.kata_kunci_layanan.map((kw: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}>
                          {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm italic" style={{ color: "var(--text-muted)" }}>-</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 sm:p-5 rounded-2xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Globe size={16} style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                        {language === "EN" ? "Operation Areas" : "Wilayah Operasi"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {cp.wilayah_operasi?.join(", ") || <span className="italic text-[var(--text-muted)]">-</span>}
                    </p>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Tag size={16} style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                        {language === "EN" ? "Max Contract Value" : "Nilai Kontrak Maksimal"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {cp.nilai_proyek_max 
                        ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(cp.nilai_proyek_max)
                        : <span className="italic text-[var(--text-muted)]">-</span>
                      }
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl border" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size={16} style={{ color: "var(--text-muted)" }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                      {language === "EN" ? "KBLI & SBU" : "KBLI & SBU"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[...(cp.kode_kbli || []), ...(cp.bidang_usaha || [])].map((item: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
