const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://Admin_seleno:rizkyandriyanto@cluster0.uyeqk8w.mongodb.net/seleno_db?appName=Cluster0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('seleno_db');
    const tenders = database.collection('tenders');

    const sampleTenders = await tenders.find({ url_lpse: { $exists: true, $ne: "" }, lelangId: { $exists: true, $ne: null } }).limit(5).toArray();

    for (const t of sampleTenders) {
      console.log(`Lelang ID: ${t.lelangId}, URL: ${t.url_lpse}, Kategori: ${t.kategori}`);
    }
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
