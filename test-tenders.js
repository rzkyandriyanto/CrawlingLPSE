const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/seleno_db').then(async () => {
  const User = mongoose.connection.collection('users');
  const user = await User.findOne({ company_profile: { $exists: true } }, { sort: { _id: -1 } });
  
  const Lelang = mongoose.connection.collection('paket_lelang');
  const activeLelang = await Lelang.find({ 
    is_deleted: { $ne: true },
    status: { $nin: ["selesai", "menang", "batal", "gagal"] } 
  }).toArray();
  
  console.log("User tag (bidang):", user?.tag);
  console.log("Total active lelang:", activeLelang.length);
  
  const matchingBidang = activeLelang.filter(l => {
    if (!user?.tag) return false;
    try {
      const tags = JSON.parse(user.tag);
      return tags.some(t => {
        const regex = new RegExp(`^${t}$`, 'i');
        const fallbackRegex = new RegExp(t, 'i');
        return regex.test(l.tag) || fallbackRegex.test(l.tag) || fallbackRegex.test(l.kategori);
      });
    } catch(e) {
      return false;
    }
  });
  
  console.log("Matching bidang:", matchingBidang.length);
  
  process.exit(0);
});
