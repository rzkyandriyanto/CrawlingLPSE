require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.collection('reviews').deleteMany({ userName: "Agent" });
  console.log("Cleaned up agent tests");
  process.exit(0);
}
clean();
