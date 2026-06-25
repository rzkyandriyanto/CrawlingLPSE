const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/seleno_db');
  const User = mongoose.connection.collection('users');
  const cpUser = await User.findOne({ company_profile: { $exists: true } }, { sort: { _id: -1 } });
  
  const reqBody = { keyword: '', bidang: [], filterTipe: 'Semua', filterStatus: 'Semua', userId: cpUser._id.toString() };

  const res = await fetch('http://localhost:3000/api/keyword-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqBody)
  });
  const data = await res.text();
  console.log(data.substring(0, 500)); // print first 500 chars
  process.exit(0);
}
test();
