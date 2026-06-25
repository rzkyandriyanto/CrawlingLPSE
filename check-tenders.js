const mongoose = require('mongoose');
async function test() {
  await mongoose.connect('mongodb://localhost:27017/seleno_db');
  const Tenders = mongoose.connection.collection('tenders');
  const count = await Tenders.countDocuments({ is_deleted: { $ne: true } });
  console.log('Total tenders:', count);
  process.exit(0);
}
test();
