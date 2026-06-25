const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://Admin_seleno:rizky123@seleno-cluster.wmnemk9.mongodb.net/seleno_db?appName=seleno-cluster').then(async () => {
  const t = await mongoose.connection.collection('tenders').findOne({ url_lpse: /mock/i });
  console.log(t ? 'FOUND in Atlas: ' + t.url_lpse : 'Not found in Atlas');
  process.exit(0);
});
