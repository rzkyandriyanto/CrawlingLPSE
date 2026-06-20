import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  nama_lengkap: { type: String, default: "" },
  perusahaan: { type: String, default: "" },
  bidang_minat: { type: [String], default: [] },
  avatar_url: { type: String, default: "/uploads/avatars/default-avatar.png" },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  // Lokasi untuk personalisasi wilayah
  kota: { type: String, default: "" },
  provinsi: { type: String, default: "" },
  
  // Data Hasil Ekstraksi PDF Company Profile (Opsional / Doping Algoritma)
  company_profile: {
    nama_perusahaan: { type: String, default: "" },
    bidang_usaha: { type: [String], default: [] },
    sub_bidang: { type: [String], default: [] },
    kode_kbli: { type: [String], default: [] },
    kode_sbu: { type: [String], default: [] },
    kualifikasi: { type: String, default: "" },
    domisili: {
      kota: { type: String, default: "" },
      provinsi: { type: String, default: "" }
    },
    wilayah_operasi: { type: [String], default: [] },
    pengalaman_proyek: [{
      nama_proyek: String,
      pemberi_kerja: String,
      nilai_kontrak: Number,
      tahun: String
    }],
    nilai_proyek_max: { type: Number, default: 0 },
    sertifikasi: { type: [String], default: [] },
    kata_kunci_layanan: { type: [String], default: [] },
    tenaga_ahli: { type: [String], default: [] },
    tahun_berdiri: { type: String, default: "" },
    pdf_url: { type: String, default: "" }
  },

  // Riwayat keyword pencarian (maksimal 20 terakhir)
  search_history: { type: [String], default: [] },
  session_token: { type: String, default: "" },
  login_attempts: { type: Number, default: 0 },
  lock_until: { type: Date, default: null },
  last_ip: { type: String, default: null },
  last_user_agent: { type: String, default: null },
}, { timestamps: true });
if (mongoose.models?.User) {
  delete mongoose.models.User;
}
export const UserModel = mongoose.model("User", UserSchema);
