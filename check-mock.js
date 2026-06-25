const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/seleno_db').then(async () => {
  const t = await mongoose.connection.collection('tenders').findOne({ $or: [{ url_lpse: /mock/i }, { url_pemenang: /mock/i }, { url_hasil_evaluasi: /mock/i }] });
  console.log(t ? 'FOUND in DB: ' + t.lelangId : 'Not found in DB');
  process.exit(0);
});
