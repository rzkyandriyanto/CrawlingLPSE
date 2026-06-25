require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const { LPSE_LIST } = require("./scripts/lpse-scraper/lpse-list");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/seleno_db";

const LpseSourceSchema = new mongoose.Schema({
  nama:          { type: String },
  url:           { type: String, unique: true },
  isActive:      { type: Boolean, default: true },
  failCount:     { type: Number,  default: 0 },
  lastSuccessAt: { type: Date },
  lastFailAt:    { type: Date },
});

const LpseSourceModel = mongoose.models.LpseSource || mongoose.model("LpseSource", LpseSourceSchema);

async function fixDb() {
  await mongoose.connect(MONGO_URI);
  console.log("Terhubung ke MongoDB.");

  // Hapus semua source Jabodetabek yang ada saat ini untuk menghindari duplikat URL lama vs baru
  await LpseSourceModel.deleteMany({});
  console.log("Menghapus semua URL LPSE lama dari database...");

  console.log("Mencari LPSE wilayah Jabodetabek dari lpse-list.js yang sudah diperbaiki...");
  const jabodetabekKeywords = ['jakarta', 'bogor', 'depok', 'tangerang', 'bekasi'];
  
  const filteredList = LPSE_LIST.filter(lpse => 
    jabodetabekKeywords.some(kw => lpse.nama.toLowerCase().includes(kw))
  );

  console.log(`Ditemukan ${filteredList.length} LPSE Jabodetabek.`);

  let inserted = 0;
  for (const lpse of filteredList) {
    const result = await LpseSourceModel.updateOne(
      { url: lpse.url },
      {
        $set: { nama: lpse.nama, url: lpse.url },
        $setOnInsert: { isActive: true, failCount: 0 }
      },
      { upsert: true }
    );
    if (result.upsertedCount > 0 || result.modifiedCount > 0) {
      inserted++;
      console.log(`[+] Disimpan: ${lpse.nama} -> ${lpse.url}`);
    }
  }

  const totalAktif = await LpseSourceModel.countDocuments({ isActive: true });
  console.log(`\nBerhasil memproses LPSE Jabodetabek. Total LPSE aktif di database saat ini: ${totalAktif}`);
  
  await mongoose.disconnect();
}

fixDb().catch(console.error);
