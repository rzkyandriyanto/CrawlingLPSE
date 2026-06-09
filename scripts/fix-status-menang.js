// Migrasi: Update status ke "menang" untuk tender yang sudah punya data pemenang
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const col = mongoose.connection.collection('tenders');

  const result = await col.updateMany(
    { 
      pemenang_nama: { $exists: true, $nin: [null, ''] },
      status: 'selesai'
    },
    { $set: { status: 'menang' } }
  );

  console.log(`✅ Status diupdate ke "menang": ${result.modifiedCount} tender`);
  
  const totalMenang = await col.countDocuments({ status: 'menang' });
  console.log(`   Total tender berstatus "menang" sekarang: ${totalMenang}`);
  
  process.exit(0);
});
