const mongoose = require('mongoose');

async function run() {
  try {
require('dotenv').config({ path: '.env.local' });
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB...");
    
    // In mongoose, the default collection name for model "Tender" is "tenders"
    const Tender = mongoose.model('Tender', new mongoose.Schema({}, { strict: false }));
    
    const results = await Tender.aggregate([
      { $group: { _id: "$instansi", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    console.log("\n=== 10 INSTANSI LPSE DENGAN DATA TERBANYAK ===");
    results.forEach((r, i) => {
      console.log(`${i+1}. ${r._id || 'Tidak Diketahui'} : ${r.count} tender`);
    });
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

run();
