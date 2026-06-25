const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/seleno_db').then(async () => {
  const User = mongoose.connection.collection('users');
  const user = await User.findOne({ company_profile: { $exists: true } }, { sort: { _id: -1 } });
  console.log(JSON.stringify(user?.company_profile || null, null, 2));
  process.exit(0);
});
