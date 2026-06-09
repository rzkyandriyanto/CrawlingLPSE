require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const col = mongoose.connection.collection('tenders');
  
  const hasPemenang = await col.countDocuments({
    pemenang_nama: { $exists: true, $nin: [null, ''] }
  });
  
  const sample = await col.findOne(
    { pemenang_nama: { $exists: true, $nin: [null, ''] } },
    { pemenang_nama: 1, status: 1, nama_paket: 1, pemenang_harga: 1 }
  );
  
  // Distribusi status untuk yang punya pemenang
  const statusDist = await col.aggregate([
    { $match: { pemenang_nama: { $exists: true, $nin: [null, ''] } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]).toArray();

  console.log('Tender dengan data pemenang:', hasPemenang);
  console.log('Distribusi status:', JSON.stringify(statusDist, null, 2));
  if (sample) {
    console.log('\nContoh tender:');
    console.log('  Nama     :', sample.nama_paket?.slice(0, 60));
    console.log('  Pemenang :', sample.pemenang_nama);
    console.log('  Harga    :', sample.pemenang_harga);
    console.log('  Status   :', sample.status);
  }
  
  process.exit(0);
});
