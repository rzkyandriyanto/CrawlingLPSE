const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/seleno_db');
  
  const query = { is_deleted: { $ne: true } };
  
  const pipeline = [
    { $match: query },
    {
      $addFields: {
        tahap_lower: { $toLower: { $ifNull: ["$tahap_saat_ini", ""] } }
      }
    },
    {
      $addFields: {
        tahap_weight: {
          $switch: {
            branches: [
              { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "prakualifikasi"] }, 0] }, then: 1 },
              { case: { $gte: [{ $indexOfCP: ["$tahap_lower", "pengumuman"] }, 0] }, then: 1 }
            ],
            default: 99
          }
        }
      }
    },
    { $sort: { tahap_weight: 1, createdAt: -1 } }
  ];
  
  try {
    const db = mongoose.connection;
    const result = await db.collection('tenders').aggregate(pipeline).toArray();
    console.log("Agg returned:", result.length);
  } catch (err) {
    console.error("Agg error:", err);
  }
  process.exit(0);
}
test();
