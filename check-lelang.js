const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/seleno_db');
  const Lelang = mongoose.connection.collection('paket_lelang');
  const c = await Lelang.countDocuments({ is_deleted: { $ne: true } });
  console.log("Total paket lelang:", c);
  
  const c2 = await Lelang.countDocuments({ is_deleted: { $ne: true }, status: 'aktif' });
  console.log("Total aktif paket lelang:", c2);
  
  process.exit(0);
}
test();
