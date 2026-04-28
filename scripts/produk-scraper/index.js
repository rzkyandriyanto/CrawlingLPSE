require("dotenv").config({ path: ".env.local" });
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const { createClient } = require("@supabase/supabase-js");

puppeteer.use(StealthPlugin());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function extractDataFromHtml(htmlString) {
  if (!htmlString) return "";
  return htmlString.replace(/<[^>]*>?/gm, "").trim();
}

// Daftar kategori yang sesuai dengan bidang pilihan user
const kategoriTargets = [
  { tag: "Teknologi",  urls: [
    "https://www.indonetwork.co.id/k/laptop",
    "https://www.indonetwork.co.id/k/komputer",
    "https://www.indonetwork.co.id/k/printer",
    "https://www.indonetwork.co.id/k/server",
  ]},
  { tag: "Otomotif", urls: [
    "https://www.indonetwork.co.id/k/mobil",
    "https://www.indonetwork.co.id/k/motor",
    "https://www.indonetwork.co.id/k/sparepart-mobil",
  ]},
  { tag: "Konstruksi", urls: [
    "https://www.indonetwork.co.id/k/bahan-bangunan",
    "https://www.indonetwork.co.id/k/besi-baja",
    "https://www.indonetwork.co.id/k/pipa",
  ]},
  { tag: "Kesehatan", urls: [
    "https://www.indonetwork.co.id/k/alat-kesehatan",
    "https://www.indonetwork.co.id/k/obat",
    "https://www.indonetwork.co.id/k/alat-medis",
  ]},
  { tag: "Logistik", urls: [
    "https://www.indonetwork.co.id/k/forklift",
    "https://www.indonetwork.co.id/k/pallet",
    "https://www.indonetwork.co.id/k/rak-gudang",
  ]},
  { tag: "Pangan", urls: [
    "https://www.indonetwork.co.id/k/makanan",
    "https://www.indonetwork.co.id/k/minuman",
    "https://www.indonetwork.co.id/k/beras",
  ]},
];

async function scrapeCategory(page, url, tag) {
  const produkList = [];
  try {
    console.log(`  [INDONETWORK] Mengambil: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Ambil semua link produk di halaman ini
    const produkLinks = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('a[href*="/product/"]').forEach(a => {
        const href = a.href;
        const name = a.innerText.trim();
        if (name && href && !links.find(l => l.href === href)) {
          links.push({ href, name });
        }
      });
      return links.slice(0, 15); // Maks 15 produk per kategori
    });

    for (const item of produkLinks) {
      produkList.push({
        nama_produk: item.name,
        deskripsi: `Produk ${tag} dari Indonetwork`,
        nama_perusahaan: "Supplier Indonesia",
        harga: "Hubungi Penjual",
        gambar_url: "",
        tag: tag,
        kategori: "Produk",
        kota: "Indonesia",
        url_produk: item.href,
      });
    }
    console.log(`  [INDONETWORK] Didapat ${produkList.length} produk dari ${url}`);
  } catch (err) {
    console.log(`  [INDONETWORK] Gagal mengambil ${url}: ${err.message}`);
  }
  return produkList;
}

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

  for (const kategori of kategoriTargets) {
    console.log(`\n[KATEGORI] Mengambil produk bidang: ${kategori.tag}`);
    let allProduk = [];

    for (const url of kategori.urls) {
      const produk = await scrapeCategory(page, url, kategori.tag);
      allProduk = [...allProduk, ...produk];
    }

    if (allProduk.length > 0) {
      console.log(`[SUPABASE] Mengunggah ${allProduk.length} produk '${kategori.tag}' ke tabel produk...`);
      const { error } = await supabase.from("produk").insert(allProduk);
      if (error) {
        console.error(`[SUPABASE] Gagal:`, error.message);
      } else {
        console.log(`[SUPABASE] Sukses! Produk '${kategori.tag}' tersimpan.`);
      }
    }
  }

  await browser.close();
  console.log("\n[SELESAI] Semua produk dari Indonetwork berhasil discrape!");
}

run();
