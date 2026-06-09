const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Tender = mongoose.model('Tender', new mongoose.Schema({}, { strict: false }));
  const res = await Tender.aggregate([
    { $match: { instansi: { $regex: "Tasikmalaya|Mahkamah", $options: "i" } } },
    { $group: { _id: '$instansi', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 }
  ]);
  console.log("DB Data:", res);
  mongoose.disconnect();
});
