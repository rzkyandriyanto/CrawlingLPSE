const mongoose = require('mongoose');

function classifyPaket(nama) {
  const n = (nama || "").toLowerCase();
  const map = [
    { tag: "Teknologi", kw: ["sound system","audio","speaker","microphone","drone","uav","pesawat tanpa awak","sistem informasi","aplikasi","software","hardware","server","jaringan","komputer","laptop"," pc ","notebook","internet","website"," web ","cloud","cctv","wifi"," it ","digital","fiber optic","bandwidth","perangkat lunak","perangkat keras","lisensi","kamera","vtron","videotron","komunikasi","switch","router","akses poin","firewall","data center","gps","tracker","audio visual","teleconference","proyektor","ups","smartboard","sistem elektronik","hosting","elektronik","mesin fotokopi","fotokopi","cetak","pencetakan","media","publikasi","spectrometry","alat ukur","mesin"] },
    { tag: "Konstruksi", kw: ["pembangunan","konstruksi","jalan","jembatan","gedung","rehabilitasi","renovasi","drainase","irigasi","saluran","talud","trotoar","pondasi","bendungan","tanggul","gorong","dermaga","pengaspalan","rigid","box culvert","perkerasan","bronjong","aspal","peningkatan","pemeliharaan","paving","taman","pagar","plengsengan","normalisasi","siring","rehab","bangunan","fasilitas","infrastruktur","jaring","air bersih","spam","sanitasi","rth","ruang terbuka hijau","sumur","asrama","halte","perbaikan","penataan","semen","hotmix","penahan tanah"] },
    { tag: "Kesehatan", kw: ["kesehatan","medis","obat","alat kesehatan","rumah sakit","rsud","puskesmas","klinik","vaksin","laboratorium","radiologi","ambulans","farmasi","apotek","imunisasi","alkes","bmhp","reagen","kedokteran","stunting","gizi","usg","rontgen","oksigen","posyandu","dokter","pmt ","pemberian makanan tambahan","bblr","dinkes","masker","apd","antigen"] },
    { tag: "Konsultansi", kw: ["jasa konsultansi","konsultan","perencana","pengawasan","supervisi","manajemen proyek","studi kelayakan","amdal","ukl","upl","masterplan","master plan"," ded ","desain","kajian","penyusunan","dokumen","naskah akademik","detail engineering"," fs ","perancangan","tata ruang","rdtr","rtrw","penilaian","appraisal","audit","inventarisasi"] },
    { tag: "Pendidikan", kw: ["pendidikan","sekolah"," sdn "," smpn "," sman "," tk ","paud","pelatihan","buku","alat tulis","meja belajar","kursi sekolah","perpustakaan","bimtek","diklat","bimbingan teknis","alat peraga","laboratorium bahasa","siswa","guru","pengajar","modul","beasiswa","ijazah","rapor","drumband","alat musik","seragam sekolah"] },
    { tag: "Otomotif", kw: ["kendaraan dinas","mobil","motor","sepeda motor","bus","minibus","pickup","pick up","pemadam kebakaran","damkar","derek","angkutan","speedboat","perahu","kapal","truk","dump truck","roda empat","roda dua","roda tiga","ban ","suku cadang","kendaraan","pelumas","karoseri","sparepart"] },
    { tag: "Jasa Umum", kw: ["kebersihan","keamanan","cleaning service","security","satuan pengamanan","event organizer"," eo ","pameran","jasa sewa","penggandaan","baliho","spanduk","umbul-umbul","banner","seragam","pakaian dinas"," pdh "," pdl ","furniture","mebel","atk","alat tulis kantor","makan minum","asuransi","tiket","akomodasi","hotel","rapat","meeting","tenaga ahli","tenaga kerja","outsourcing","tenda","kursi lipat","terop",
    // Eks Logistik
    "logistik","pengiriman","distribusi","cargo","kargo","jasa angkut","bongkar muat","kurir","pos ","transportasi barang",
    // Eks Pangan
    "pertanian","pangan","beras","pupuk","benih","bibit","nelayan","perikanan","ternak","perkebunan","makanan","catering","konsumsi","makan siang","sapi","kambing","unggas","ayam","traktor","jaring ikan","kapal penangkap","pakan","hewan","sayur","buah","bibit pohon","sembako","bantuan sosial pangan","perah","cultivator","hand traktor","perahu nelayan"] }
  ];
  for (const b of map) {
    for (const kw of b.kw) {
      if (n.includes(kw)) {
        return { tag: b.tag }; 
      }
    }
  }
  return { tag: "Lainnya" };
}

async function run() {
  try {
    require('dotenv').config({ path: '.env.local' });
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB, scanning for updates...");
    const TenderModel = mongoose.model('Tender', new mongoose.Schema({}, { strict: false }));
    
    // Find all that were classified as Lainnya or any others to re-classify
    const items = await TenderModel.find({}).lean();
    console.log(`Found ${items.length} total items. Analyzing...`);
    
    let updated = 0;
    let newLainnya = 0;
    let oldLainnya = 0;
    
    for (const item of items) {
      if (item.tag === "Lainnya") oldLainnya++;
      
      const newClass = classifyPaket(item.nama_paket);
      
      if (newClass.tag === "Lainnya") newLainnya++;
      
      if (newClass.tag !== item.tag) {
        await TenderModel.updateOne({ _id: item._id }, { $set: { tag: newClass.tag } });
        updated++;
      }
    }
    
    console.log(`Update complete. Modified ${updated} items.`);
    console.log(`Old 'Lainnya' count: ${oldLainnya}`);
    console.log(`New 'Lainnya' count: ${newLainnya}`);
    
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

run();
