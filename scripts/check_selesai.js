require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const col = mongoose.connection.collection('tenders');

  // Cek semua status
  const statusDist = await col.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  console.log('=== Distribusi Status ===');
  statusDist.forEach(s => console.log(`  ${s._id}: ${s.count}`));

  // Cek tender selesai
  const totalSelesai = await col.countDocuments({ status: 'selesai' });
  const selesaiDgnPemenang = await col.countDocuments({ 
    status: 'selesai', 
    pemenang_nama: { $exists: true, $nin: [null, ''] } 
  });
  const selesaiDgnPeserta = await col.countDocuments({ 
    status: 'selesai', 
    'peserta_evaluasi': { $exists: true, $ne: null }
  });

  console.log('\n=== Tender Selesai ===');
  console.log(`  Total selesai: ${totalSelesai}`);
  console.log(`  Punya pemenang_nama: ${selesaiDgnPemenang}`);
  console.log(`  Punya peserta_evaluasi: ${selesaiDgnPeserta}`);

  // Sample tender selesai yang punya data pemenang di peserta_evaluasi
  const sample = await col.findOne(
    { status: 'selesai', 'peserta_evaluasi': { $exists: true, $ne: null } },
    { nama_paket: 1, pemenang_nama: 1, peserta_evaluasi: 1, status: 1 }
  );
  if (sample) {
    console.log('\n=== Sample Tender Selesai dengan peserta_evaluasi ===');
    console.log('  Nama:', sample.nama_paket?.slice(0, 60));
    console.log('  pemenang_nama:', sample.pemenang_nama || '(kosong)');
    console.log('  peserta_evaluasi type:', typeof sample.peserta_evaluasi);
    if (Array.isArray(sample.peserta_evaluasi)) {
      console.log('  peserta_evaluasi length:', sample.peserta_evaluasi.length);
      console.log('  peserta_evaluasi[0]:', JSON.stringify(sample.peserta_evaluasi[0])?.slice(0, 200));
    } else if (sample.peserta_evaluasi) {
      console.log('  peserta_evaluasi (non-array):', JSON.stringify(sample.peserta_evaluasi)?.slice(0, 300));
    }
  }

  process.exit(0);
});
