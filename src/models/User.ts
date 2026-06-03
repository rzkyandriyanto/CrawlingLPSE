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
  // Riwayat keyword pencarian (maksimal 20 terakhir)
  search_history: { type: [String], default: [] },
}, { timestamps: true });
if (mongoose.models?.User) {
  delete mongoose.models.User;
}
export const UserModel = mongoose.model("User", UserSchema);
