import mongoose from "mongoose";

const TenderSchema = new mongoose.Schema({
  lelangId: { type: String, required: true, unique: true },
  nama_paket: { type: String, required: true },
  instansi: String,
  hps: String,
  pagu: String,
  pagu_num: { type: Number, default: 0, index: true }, // Nilai numerik Pagu untuk agregasi BI
  hps_num: { type: Number, default: 0 },  // Nilai numerik HPS untuk agregasi BI
  kategori: { type: String, index: true }, // Menambahkan index pada kategori
  tag: String,
  metode_pengadaan: String,
  wilayah: String,
  url_lpse: String,
  jadwal: [
    {

      tahap: String,
      mulai: String,
      sampai: String,
      perubahan: String
    }
  ],
  alasan_diulang: String,
  pinned_by_users: { type: [String], default: [] },
  finished_at: { type: Date },
  ai_summary: { type: String, default: null },
  ai_summary_at: { type: Date, default: null },
  // Arsip: status lifecycle tender
  status: {
    type: String,
    enum: ["aktif", "gagal", "selesai", "menang"],
    default: "aktif",
    index: true,
  },
  archived_at: { type: Date, default: null }, // Kapan masuk arsip → hapus setelah 3 hari
  archived_reason: { type: String, default: null }, // Alasan pengarsipan
  archived_by: { type: String, default: null }, // userId yang mengarsipkan
  is_deleted: { type: Boolean, default: false, index: true }, // Soft delete flag untuk keperluan analisis

}, { timestamps: true, strict: false });

// Menambahkan index untuk tanggalBerakhir (biasa)
TenderSchema.index({ tanggalBerakhir: 1 });

// Menambahkan text index untuk namaLpse dan judulTender untuk fitur pencarian
TenderSchema.index({ namaLpse: "text", judulTender: "text" });

export const TenderModel = mongoose.models?.Tender || mongoose.model("Tender", TenderSchema);
