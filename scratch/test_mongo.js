const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://Admin_seleno:rizkyandriyanto@cluster0.uyeqk8w.mongodb.net/seleno_db?appName=Cluster0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('seleno_db');
    const tenders = database.collection('tenders');

    const query = { url_lpse: { $regex: /kejaksaan/i } };
    const tender = await tenders.findOne(query);

    console.log(tender ? tender.url_lpse : "Not found");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
