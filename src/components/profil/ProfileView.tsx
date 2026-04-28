import { motion } from "framer-motion";
import { User, Camera, Mail, Edit3, Save, XCircle, Tag, MapPin, Building2, Globe } from "lucide-react";
import { StoredUser } from "@/types";

type ProfileViewProps = {
  user: StoredUser;
  language: "ID" | "EN";
  uploadingFoto: boolean;
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
  onFotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  isEditingProfile,
  profileSaving,
  profileForm,
  fileInputRef,
  onFotoUpload,
  onStartEditing,
  onCancelEditing,
  onSaveProfile,
  onFormChange,
  onToggleProfileTag,
  daftarBidang,
  selectedBidang,
}: ProfileViewProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
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
                <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100">
                  {user.foto_url ? (
                    <img
                      src={user.foto_url}
                      alt="Foto Profil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <User size={48} className="text-slate-400" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFoto}
                  className="absolute bottom-1 right-1 p-2.5 bg-black text-white rounded-full shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50 border-2 border-white"
                  title={language === "EN" ? "Change Photo" : "Ganti Foto"}
                >
                  {uploadingFoto ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-dashed border-white" />
                  ) : (
                    <Camera size={16} />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onFotoUpload}
                />
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
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-lg font-black outline-none focus:border-black transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => onFormChange("email", e.target.value)}
                      placeholder={language === "EN" ? "Company Email" : "Email Perusahaan"}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold outline-none focus:border-black transition-all"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {user.perusahaan || (language === "EN" ? "Company Name" : "Nama Perusahaan")}
                  </h2>
                  <p className="text-sm text-slate-400 font-medium mt-1 flex items-center gap-1.5">
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
              >
                <Edit3 size={15} /> {language === "EN" ? "Edit Profile" : "Edit Profil"}
              </button>
            ) : (
              <div className="mb-8 flex gap-2">
                <button
                  onClick={onSaveProfile}
                  disabled={profileSaving}
                  className="px-5 py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-black/10 flex items-center gap-2 disabled:opacity-50"
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
                  className="px-5 py-2.5 bg-white text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all border-2 border-slate-200 flex items-center gap-2"
                >
                  <XCircle size={15} /> {language === "EN" ? "Cancel" : "Batal"}
                </button>
              </div>
            )}

            {/* Profile Info Grid */}
            <div className="space-y-5">
              {/* Bidang Usaha */}
              <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={16} className="text-slate-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
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
                          className={`px-3 py-2.5 rounded-xl font-bold text-sm transition-all border-2 ${
                            isSelected
                              ? "bg-black text-white border-black shadow-lg shadow-black/10"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                          }`}
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
                        <span
                          key={b}
                          className="px-3 py-1.5 bg-black text-white rounded-lg text-xs font-bold"
                        >
                          {b}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400 italic">
                        {language === "EN" ? "Not selected" : "Belum dipilih"}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Kota & Provinsi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {language === "EN" ? "City" : "Kota"}
                    </span>
                  </div>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileForm.kota}
                      onChange={(e) => onFormChange("kota", e.target.value)}
                      placeholder={language === "EN" ? "Enter city" : "Masukkan kota"}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold outline-none focus:border-black transition-all"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-700">
                      {user.kota || (
                        <span className="text-slate-400 italic">
                          {language === "EN" ? "Not filled" : "Belum diisi"}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 size={16} className="text-slate-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {language === "EN" ? "Province" : "Provinsi"}
                    </span>
                  </div>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileForm.provinsi}
                      onChange={(e) => onFormChange("provinsi", e.target.value)}
                      placeholder={language === "EN" ? "Enter province" : "Masukkan provinsi"}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold outline-none focus:border-black transition-all"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-slate-700">
                      {user.provinsi || (
                        <span className="text-slate-400 italic">
                          {language === "EN" ? "Not filled" : "Belum diisi"}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Website */}
              <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Globe size={16} className="text-slate-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {language === "EN" ? "Company Website" : "Website Perusahaan"}
                  </span>
                </div>
                {isEditingProfile ? (
                  <input
                    type="url"
                    value={profileForm.website}
                    onChange={(e) => onFormChange("website", e.target.value)}
                    placeholder={language === "EN" ? "https://company.com" : "https://perusahaan.com"}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold outline-none focus:border-black transition-all"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-700">
                    {user.website ? (
                      <a
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1.5"
                      >
                        {user.website} <Globe size={13} />
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">
                        {language === "EN" ? "Not filled" : "Belum diisi"}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
