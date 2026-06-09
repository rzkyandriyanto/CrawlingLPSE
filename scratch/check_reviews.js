require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const reviews = await mongoose.connection.collection('reviews').find().toArray();
  console.log(JSON.stringify(reviews, null, 2));
  process.exit(0);
}
check();
