const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/seleno_db');
  
  const query = { 
    is_deleted: { $ne: true },
    $and: [
      {
        $or: [
          { wilayah: { $regex: 'tangerang', $options: 'i' } },
          { instansi: { $regex: 'tangerang', $options: 'i' } }
        ]
      }
    ]
  };
  
  const db = mongoose.connection;
  const count = await db.collection('tenders').countDocuments(query);
  console.log("Tenders with tangerang:", count);
  process.exit(0);
}
test();
