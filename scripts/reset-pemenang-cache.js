// Migrasi massal: Reset info_synced_at untuk semua tender "selesai" tanpa pemenang_nama
// agar sync-info mau re-scrape pemenangnya
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const col = mongoose.connection.collection('tenders');

  // Reset cache agar sync-info mau re-scrape
  const result = await col.updateMany(
    {
      status: 'selesai',
      $or: [
        { pemenang_nama: { $exists: false } },
        { pemenang_nama: null },
        { pemenang_nama: '' }
      ]
    },
    {
      $unset: { info_synced_at: '' }  // hapus cache timestamp → paksa re-scrape
    }
  );

  console.log(`✅ Reset cache untuk ${result.modifiedCount} tender selesai`);
  console.log('   Sekarang sync-info akan re-scrape pemenang saat tender dibuka pengguna.');
  console.log('   Atau jalankan deep-sync di scraper untuk memproses semua sekaligus.');

  process.exit(0);
});
