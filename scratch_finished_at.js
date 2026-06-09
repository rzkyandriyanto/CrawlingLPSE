require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const col = mongoose.connection.collection('tenders');

  const countFinished = await col.countDocuments({ status: { $in: ["selesai", "menang"] } });
  const countWithFinishedAt = await col.countDocuments({ status: { $in: ["selesai", "menang"] }, finished_at: { $exists: true, $ne: null } });

  console.log('Total finished:', countFinished);
  console.log('Total with finished_at:', countWithFinishedAt);

  process.exit(0);
});
