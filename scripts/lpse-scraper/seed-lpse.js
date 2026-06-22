/**
 * seed-lpse.js
 * ══════════════════════════════════════════════════════════════════════
 * Script untuk mengisi collection MongoDB "lpse_sources" dari file
 * statis lpse-list.js.
 *
 * Cara pakai: npm run seed:lpse
 *
 * Menggunakan upsert (insertOrUpdate) berdasarkan field "url" sehingga
 * aman dijalankan berulang kali tanpa membuat data duplikat.
 * ══════════════════════════════════════════════════════════════════════
 */

require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const { LPSE_LIST } = require("./lpse-list");

// ── Konfigurasi koneksi MongoDB ────────────────────────────────────────────
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/seleno_db";

// ── Schema LpseSource (sama persis dengan yang ada di index.js) ───────────
const LpseSourceSchema = new mongoose.Schema({
  nama:          { type: String },           // Nama LPSE
  url:           { type: String, unique: true }, // URL unik LPSE
  isActive:      { type: Boolean, default: true }, // Status aktif scraping
  failCount:     { type: Number,  default: 0 },    // Hitungan kegagalan berturut-turut
  lastSuccessAt: { type: Date },             // Kapan terakhir berhasil
  lastFailAt:    { type: Date },             // Kapan terakhir gagal
});

const LpseSourceModel = mongoose.model("LpseSource", LpseSourceSchema);

async function seedLpse() {
  console.log("━".repeat(60));
  console.log("🌱  LPSE SEEDER — Mengisi collection lpse_sources");
  console.log(`    Total data dari lpse-list.js: ${LPSE_LIST.length} LPSE`);
  console.log("━".repeat(60));

  // Sambungkan ke MongoDB
  await mongoose.connect(MONGO_URI);
  console.log(`✅  MongoDB terhubung: ${MONGO_URI}\n`);

  let inserted = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const lpse of LPSE_LIST) {
    try {
      // Gunakan upsert agar aman dijalankan berkali-kali
      // $set  → selalu update nama (jika nama LPSE berubah di lpse-list.js)
      // $setOnInsert → hanya diisi saat dokumen BARU dibuat
      const result = await LpseSourceModel.updateOne(
        { url: lpse.url },  // Cari berdasarkan URL (unik)
        {
          $set: {
            nama: lpse.nama,  // Update nama jika ada perubahan
            url:  lpse.url,
          },
          $setOnInsert: {
            // Field ini HANYA diisi saat dokumen baru dibuat (insert)
            isActive:  true,
            failCount: 0,
          }
        },
        { upsert: true }  // Buat baru jika belum ada
      );

      if (result.upsertedCount > 0) {
        inserted++;
        process.stdout.write(`  [+] ${lpse.nama}\n`);
      } else {
        skipped++;
        // Tidak perlu log tiap skip agar output tidak terlalu panjang
      }
    } catch (err) {
      errors++;
      console.error(`  [✗] Gagal: ${lpse.nama} — ${err.message}`);
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log(`✅  Seeder selesai!`);
  console.log(`    Baru ditambahkan : ${inserted} LPSE`);
  console.log(`    Sudah ada (skip) : ${skipped} LPSE`);
  if (errors > 0) {
    console.log(`    Gagal            : ${errors} LPSE`);
  }
  console.log("═".repeat(60));

  // Tampilkan total aktif setelah seeding
  const totalAktif = await LpseSourceModel.countDocuments({ isActive: true });
  console.log(`\n📊  Total LPSE aktif di database: ${totalAktif}`);
  console.log("    Sekarang bisa jalankan: npm run dev:scraper\n");

  await mongoose.disconnect();
  process.exit(0);
}

// Jalankan
seedLpse().catch(err => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
