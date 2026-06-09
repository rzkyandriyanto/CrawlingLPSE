/**
 * Script Migrasi: Konversi pagu & hps dari String ke Number
 * Jalankan sekali dengan: node scripts/migrate-pagu.js
 * 
 * Mendukung format:
 *   "Rp 1.500.000.000,-"
 *   "Rp 500.000.000,00"
 *   "1500000000"
 *   "1.500.000.000"
 */
require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI;

/**
 * Parse string rupiah menjadi angka integer.
 * Mendukung format:
 *   "Rp 1.500.000.000,-"  → 1500000000
 *   "Rp 500.000.000,00"   → 500000000
 *   "283,1 Jt"            → 283100000
 *   "1,5 M"               → 1500000000
 *   "500 Rb"              → 500000
 *   "1500000000"          → 1500000000
 */
function parseRupiah(str) {
  if (!str || typeof str !== "string") return 0;

  const upper = str.toUpperCase().trim();

  // Deteksi multiplier (Jt = Juta, M/Miliar = Miliar, Rb/Ribu = Ribu)
  let multiplier = 1;
  if (/JT|JUTA/.test(upper))       multiplier = 1_000_000;
  else if (/\bM\b|MILIAR/.test(upper)) multiplier = 1_000_000_000;
  else if (/RB|RIBU/.test(upper))   multiplier = 1_000;

  // Ambil hanya bagian angkanya
  let numStr = upper.replace(/[^0-9.,]/g, "").trim();
  if (!numStr) return 0;

  // Format Indonesia dengan titik sebagai ribuan dan koma sebagai desimal
  // Contoh: "1.500.000,50" atau "283,1"
  if (numStr.includes(",")) {
    // Hapus semua titik (separator ribuan), ganti koma jadi titik desimal
    numStr = numStr.replace(/\./g, "").replace(",", ".");
  } else {
    // Hanya titik → separator ribuan → hapus semua
    numStr = numStr.replace(/\./g, "");
  }

  const num = parseFloat(numStr);
  if (isNaN(num)) return 0;

  return Math.round(num * multiplier);
}

async function migrate() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected.\n");

  const collection = mongoose.connection.collection("tenders");

  // Migrasi ulang semua dokumen dengan parser yang sudah diperbaiki
  const cursor = collection.find({});

  let total = 0;
  let updated = 0;
  let skipped = 0;

  console.log("🔄 Mulai migrasi pagu_num & hps_num...\n");

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    total++;

    const pagu_num = parseRupiah(doc.pagu);
    const hps_num = parseRupiah(doc.hps);

    if (pagu_num === 0 && hps_num === 0) {
      skipped++;
      continue;
    }

    await collection.updateOne(
      { _id: doc._id },
      { $set: { pagu_num, hps_num } }
    );
    updated++;

    if (updated % 100 === 0) {
      console.log(`  ✏️  ${updated} dokumen diperbarui...`);
    }
  }

  console.log("\n✅ Migrasi selesai!");
  console.log(`   Total dokumen diperiksa : ${total}`);
  console.log(`   Berhasil diperbarui     : ${updated}`);
  console.log(`   Dilewati (nilai 0/null) : ${skipped}`);

  // Contoh cek hasil
  const sample = await collection.findOne({ pagu_num: { $gt: 0 } });
  if (sample) {
    console.log("\n📋 Contoh hasil migrasi:");
    console.log(`   Nama Paket : ${sample.nama_paket?.slice(0, 60)}...`);
    console.log(`   pagu (str) : ${sample.pagu}`);
    console.log(`   pagu_num   : ${sample.pagu_num?.toLocaleString("id-ID")}`);
    console.log(`   hps (str)  : ${sample.hps}`);
    console.log(`   hps_num    : ${sample.hps_num?.toLocaleString("id-ID")}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch(err => {
  console.error("❌ Migrasi gagal:", err);
  process.exit(1);
});
