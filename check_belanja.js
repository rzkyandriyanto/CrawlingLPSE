require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const col = mongoose.connection.collection('tenders');

  const samples = await col.find({
    status: { $nin: ["selesai", "menang", "batal", "gagal"] },
    is_deleted: { $ne: true },
    nama_paket: { $regex: /belanja/i }
  }).limit(20).toArray();

  console.log("=== SAMPEL BELANJA DARI TENDER MODEL ===");
  samples.forEach(s => {
    console.log(s.nama_paket?.slice(0,50), "| Tahap:", s.tahap_saat_ini, "| Jadwal Selesai:", s.jadwal?.[s.jadwal.length - 1]?.sampai);
  });

  process.exit(0);
});
