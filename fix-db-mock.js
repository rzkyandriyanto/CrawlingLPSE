const mongoose = require('mongoose');

// Ganti URI ini dengan URI MongoDB Atlas Anda jika diperlukan
const MONGO_URI = "mongodb+srv://Admin_seleno:rizky123@seleno-cluster.wmnemk9.mongodb.net/seleno_db?appName=seleno-cluster";

async function fixMockUrls() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Terhubung ke database Atlas...");

    const tenders = await mongoose.connection.collection('tenders').find({ url_lpse: /mock/i }).toArray();
    console.log(`Ditemukan ${tenders.length} tender dengan URL mock.`);

    let updatedCount = 0;
    for (const tender of tenders) {
      if (tender.url_lpse && tender.url_lpse.includes('mock')) {
        // Ekstrak slug daerah dari URL mock, misal: http://localhost:8080/mock/lpse/sumbarprov -> sumbarprov
        const match = tender.url_lpse.match(/\/mock\/lpse\/([^/]+)/i);
        if (match && match[1]) {
          const slug = match[1];
          const newUrl = `https://spse.inaproc.id/${slug}`;
          await mongoose.connection.collection('tenders').updateOne(
            { _id: tender._id },
            { $set: { url_lpse: newUrl } }
          );
          updatedCount++;
        }
      }
    }

    console.log(`Berhasil memperbaiki ${updatedCount} URL tender dari mock ke spse.inaproc.id`);
  } catch (error) {
    console.error("Gagal memperbaiki database:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixMockUrls();
