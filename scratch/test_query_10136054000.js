const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://Admin_seleno:rizkyandriyanto@cluster0.uyeqk8w.mongodb.net/seleno_db?appName=Cluster0";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('seleno_db');
    const tenders = database.collection('tenders');

    const tender = await tenders.findOne({ lelangId: 10136054000 });

    console.log(JSON.stringify(tender, null, 2));
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
