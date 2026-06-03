require('dotenv').config({path: '.env.local'});
const { MongoClient } = require('mongodb');

const LOCAL_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seleno_db';
const CLOUD_URI = process.env.MONGODB_URI_CLOUD;

if (!CLOUD_URI) {
  console.error("❌ MONGODB_URI_CLOUD belum diset di .env.local!");
  process.exit(1);
}

async function migrate() {
  console.log("🔄 Menghubungkan ke database lokal...");
  const localClient = new MongoClient(LOCAL_URI);
  await localClient.connect();
  const localDb = localClient.db();

  console.log("☁️  Menghubungkan ke database cloud (Atlas)...");
  const cloudClient = new MongoClient(CLOUD_URI);
  
  try {
    await cloudClient.connect();
  } catch (err) {
    console.error("❌ Gagal terhubung ke Cloud Atlas. Cek kembali Username & Password di .env.local Anda!");
    console.error(err.message);
    process.exit(1);
  }
  const cloudDb = cloudClient.db();

  const collections = await localDb.listCollections().toArray();
  let totalDocs = 0;
  
  for (const collInfo of collections) {
    const collName = collInfo.name;
    // Kita lewati agendaJobs agar tidak bentrok penjadwalan
    if (collName === 'agendaJobs') continue; 

    console.log(`\n📦 Menyalin koleksi: ${collName}...`);
    const localCollection = localDb.collection(collName);
    const cloudCollection = cloudDb.collection(collName);

    const documents = await localCollection.find({}).toArray();
    if (documents.length > 0) {
      // Hapus data lama di cloud jika ada (menghindari duplikat saat dijalankan ulang)
      await cloudCollection.deleteMany({});
      await cloudCollection.insertMany(documents);
      console.log(`✅ Berhasil menyalin ${documents.length} dokumen ke koleksi ${collName}.`);
      totalDocs += documents.length;
    } else {
      console.log(`⚠️ Koleksi ${collName} kosong, dilewati.`);
    }
  }

  console.log(`\n🎉 MIGRASI SELESAI! Total ${totalDocs} dokumen berhasil dipindahkan ke Cloud.`);
  await localClient.close();
  await cloudClient.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error("Terjadi kesalahan:", err);
  process.exit(1);
});
