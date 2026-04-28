require("dotenv").config({ path: ".env.local" });
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { createClient } = require("@supabase/supabase-js");

puppeteer.use(StealthPlugin());

// Konfigurasi Supabase
// Gunakan process.env dari .env.local aplikasi Next.js Anda
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Anda bisa gunakan ANON_KEY jika RLS di mode PUBLIC INSERT, atau SERVICE_ROLE_KEY untuk amannya.
const supabase = createClient(supabaseUrl, supabaseKey);

function extractDataFromHtml(htmlString) {
  if (!htmlString) return "";
  return htmlString.replace(/<[^>]*>?/gm, "").trim();
}

// Sistem Auto-Klasifikasi Bidang berdasarkan keyword di nama paket
// Tag HARUS SAMA PERSIS dengan DAFTAR_BIDANG di src/app/pilih-bidang/page.tsx
function classifyPaket(namaPaket) {
  const nama = (namaPaket || "").toLowerCase();

  const bidangMap = [
    {
      tag: "Teknologi",
      kategori: "Pengadaan Barang",
      keywords: ["sistem informasi", "aplikasi", "software", "hardware", "server", "jaringan", "komputer", "laptop", "printer", "teknologi", "internet", "website", "bandwidth", "data center", "cloud", "cctv", "kamera", "wifi", "network", "it ", "digital"]
    },
    {
      tag: "Konstruksi",
      kategori: "Pekerjaan Konstruksi",
      keywords: ["pembangunan", "konstruksi", "jalan", "jembatan", "gedung", "rehabilitasi", "renovasi", "drainase", "irigasi", "saluran", "talud", "trotoar", "lantai", "atap", "pondasi", "bendungan", "tanggul", "gorong-gorong", "dermaga", "pelabuhan", "terminal", "penataan"]
    },
    {
      tag: "Kesehatan",
      kategori: "Pengadaan Barang",
      keywords: ["kesehatan", "medis", "obat", "alat kesehatan", "rumah sakit", "puskesmas", "klinik", "vaksin", "laboratorium", "radiologi", "ambulans", "farmasi", "apotek", "dokter", "bidan", "perawat"]
    },
    {
      tag: "Pangan",
      kategori: "Pengadaan Barang",
      keywords: ["pertanian", "pangan", "beras", "pupuk", "benih", "nelayan", "perikanan", "ternak", "perkebunan", "holtikultura", "pangan", "makanan", "catering", "konsumsi", "makan"]
    },
    {
      tag: "Logistik",
      kategori: "Jasa Lainnya",
      keywords: ["logistik", "pengiriman", "distribusi", "transportasi", "pergudangan", "gudang", "kendaraan", "truk", "angkutan", "ekspedisi", "cargo"]
    },
    {
      tag: "Otomotif",
      kategori: "Pengadaan Barang",
      keywords: ["kendaraan dinas", "mobil", "motor", "bus", "pickup", "ambulans", "pemadam", "derek", "otomotif", "spare part kendaraan", "bengkel", "servis kendaraan"]
    }
  ];

  for (const bidang of bidangMap) {
    for (const kw of bidang.keywords) {
      if (nama.includes(kw)) {
        return { tag: bidang.tag, kategori: bidang.kategori };
      }
    }
  }

  // Default: Konstruksi karena mayoritas lelang pemerintah adalah infrastruktur
  return { tag: "Konstruksi", kategori: "Pekerjaan Konstruksi" };
}

async function scrapeLpse(targetUrl, kotaName) {
  console.log(`\n[SPSE] Memulai Robot Scraper untuk: ${kotaName}`);
  console.log(`[SPSE] Menghubungkan ke ${targetUrl}...`);

  const browser = await puppeteer.launch({
    headless: false, // Membuka jendela Chrome sungguhan agar Cloudflare percaya ini manusia
    ignoreHTTPSErrors: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--ignore-certificate-errors",
      "--ignore-certificate-errors-spki-list",
      "--disable-web-security"
    ],
  });

  const page = await browser.newPage();

  // Set custom user agent untuk aman
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

  let lelangData = [];

  // Menangkap request JSON yang dilakukan oleh Datatables SPSE di background!
  page.on("response", async (response) => {
    const url = response.url();
    if (url.includes("dt/lelang")) {
      try {
        const json = await response.json();
        if (json && json.data) {
          console.log(`[SPSE] Berhasil menyadap JSON API: Menemukan ${json.data.length} paket lelang.`);

          for (const row of json.data) {
            // Urutan array JSON SPSE: [0: id/no, 1: nama_paket(HTML), 2: instansi, 3: Tahapan, 4: HPS, 5: ....]
            // Format ini bisa sedikit beda antar versi SPSE, tapi umumnya sama.

            const namaPaketRaw = row[1];
            // Ekstrak ID pengadaan dari URL jika ada
            const idMatch = namaPaketRaw ? namaPaketRaw.match(/lelang\/(\d+)\/pengumumanlelang/) : null;
            const lelangId = idMatch ? idMatch[1] : `PKG-${Date.now()}-${Math.random()}`;

            const namaPaket = extractDataFromHtml(row[1]);
            const instansi = extractDataFromHtml(row[2]);
            const tahapan = extractDataFromHtml(row[3]);
            const hps = extractDataFromHtml(row[4]);

            // Auto-klasifikasi bidang berdasarkan nama paket
            const { tag, kategori } = classifyPaket(namaPaket);

            lelangData.push({
              nama_paket: namaPaket || "Paket Tanpa Nama",
              instansi: instansi || kotaName,
              hps: hps || "Rp 0",
              pagu: hps || "Rp 0",
              kategori,
              tag,
              metode_pengadaan: tahapan || "Tender Terbuka",
              wilayah: kotaName,
              url_lpse: targetUrl,
            });
          }
        }
      } catch (e) {
        console.log(`[SPSE] Error saat parsing response data:`, e.message);
      }
    }
  });

  try {
    // Navigasi ke halaman utama lelang dan tunggu jaringan stabil
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 30000 });

    // Tunggu konten dimuat secara umum
    try {
      console.log(`[SPSE] Menunggu halaman dimuat... (Anda punya 60 detik jika ada Captcha)`);
      await page.waitForSelector("table, .table, tbody", { timeout: 60000 });
      // Berikan waktu ekstra 5 detik untuk event on('response') menangkap dan menerjemahkan JSON
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (err) {
      console.log(`[SPSE] Element tabel tidak terdeteksi dalam 60 detik.`);
    }

  } catch (error) {
    console.error("[SPSE] Terjadi kesalahan saat membuka halaman:", error);
  } finally {
    await browser.close();
    console.log(`[SPSE] Robot Scraper selesai bekerja.`);
  }

  return lelangData;
}

async function run() {
  // Daftar lengkap/banyak target LPSE (Kementerian, Provinsi, dan Kota Besar)
  const LpseList = [
    { nama: "LPSE LKPP Nasional", url: "https://spse.inaproc.id/lkpp/lelang" },
    { nama: "Kementerian PUPR", url: "https://spse.inaproc.id/pupr/lelang" },
    { nama: "Kementerian Kesehatan", url: "https://spse.inaproc.id/kemkes/lelang" },
    { nama: "Kementerian Keuangan", url: "https://spse.inaproc.id/kemenkeu/lelang" },
    { nama: "Kementerian Pendidikan", url: "https://spse.inaproc.id/kemdikbud/lelang" },
    { nama: "LPSE Provinsi DKI Jakarta", url: "https://spse.inaproc.id/dki/lelang" },
    { nama: "LPSE Provinsi Jawa Barat", url: "https://spse.inaproc.id/jabarprov/lelang" },
    { nama: "LPSE Provinsi Jawa Tengah", url: "https://spse.inaproc.id/jatengprov/lelang" },
    { nama: "LPSE Provinsi Jawa Timur", url: "https://spse.inaproc.id/jatimprov/lelang" },
    { nama: "LPSE Provinsi Banten", url: "https://spse.inaproc.id/bantenprov/lelang" },
    { nama: "LPSE Provinsi Bali", url: "https://spse.inaproc.id/baliprov/lelang" },
    { nama: "LPSE Provinsi Sumatera Utara", url: "https://spse.inaproc.id/sumutprov/lelang" },
    { nama: "LPSE Kota Bekasi", url: "https://spse.inaproc.id/bekasikota/lelang" },
    { nama: "LPSE Kota Bandung", url: "https://spse.inaproc.id/kotabandung/lelang" },
    { nama: "LPSE Kota Surabaya", url: "https://spse.inaproc.id/surabaya/lelang" },
    { nama: "LPSE Kota Semarang", url: "https://spse.inaproc.id/semarangkota/lelang" },
    { nama: "LPSE Kota Bogor", url: "https://spse.inaproc.id/kotabogor/lelang" },
    { nama: "LPSE Kota Depok", url: "https://spse.inaproc.id/depok/lelang" },
    { nama: "LPSE Kota Tangerang", url: "https://spse.inaproc.id/tangerangkota/lelang" },
    { nama: "LPSE Kota Medan", url: "https://spse.inaproc.id/pemkomedan/lelang" },
    { nama: "LPSE Kabupaten Bogor", url: "https://spse.inaproc.id/bogorkab/lelang" },
    { nama: "LPSE Kabupaten Bekasi", url: "https://spse.inaproc.id/bekasikab/lelang" }
  ];

  for (const lpse of LpseList) {
    const dataTertarik = await scrapeLpse(lpse.url, lpse.nama);

    if (dataTertarik.length > 0) {
      console.log(`[SUPABASE] Bersiap mengunggah ${dataTertarik.length} rekaman ke tabel paket_lelang...`);

      const { data, error } = await supabase
        .from("paket_lelang")
        .insert(dataTertarik);

      if (error) {
        console.error(`[SUPABASE] Gagal mengunggah data:`, error.message);
      } else {
        console.log(`[SUPABASE] Sukses! Data '${lpse.nama}' berhasil disimpan ke Database.`);
      }
    } else {
      console.log(`[SUPABASE] Tidak ada data baru untuk diunggah dari ${lpse.nama}.`);
    }
  }
}

// Eksekusi Skrip Utamnya
run();
