const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/seleno_db');
  const TenderModel = mongoose.connection.collection('tenders');
  const pipeline = [
    { $match: { is_deleted: { $ne: true } } },
    { $sort: { createdAt: -1 } }
  ];
  const items = await TenderModel.aggregate(pipeline).toArray();
  console.log("Pipeline result length:", items.length);
  process.exit(0);
}
test();
