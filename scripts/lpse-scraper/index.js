/**
 * LPSE Multi-Daerah Scraper — v4 (Puppeteer + DOM Scraping)
 * ══════════════════════════════════════════════════════════════════════════
 * Strategi:
 *  1. Buka halaman /{slug}/lelang dengan Puppeteer
 *  2. Baca tabel HTML langsung dari DOM (Next.js SSR, tidak ada XHR JSON)
 *  3. Simpan data ke MongoDB dengan upsert
 *  4. Agenda.js untuk scraping berkala (interval 2 jam agar tidak overlap)
 *
 * LPSE daftar: 400+ dari seluruh Indonesia (lpse-list.js)
 * ══════════════════════════════════════════════════════════════════════════
 */

require("dotenv").config({ path: ".env.local" });
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const mongoose = require("mongoose");
const Agenda = require("agenda");
const nodemailer = require("nodemailer");
const { buildDailyDigestHtml } = require("./email-template");
const { LPSE_LIST } = require("./lpse-list");

puppeteer.use(StealthPlugin());

// ════════════════════════════════════════════════════════════════
// KONFIGURASI
// ════════════════════════════════════════════════════════════════
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/seleno_db";
const BASE_DOMAIN = "https://spse.inaproc.id";
const PAGES_PER_LPSE = 3;           // Halaman tabel per LPSE (25 paket/halaman)
const PAGE_WAIT_MS = 4000;          // Tunggu setelah load halaman (Next.js butuh lebih lama)
const BROWSER_CONCURRENCY = 1;      // Diubah ke 1 agar tidak membuat RAM server meledak & Next.js tetap lancar
const NAV_TIMEOUT = 45000;          // Dinaikkan dari 25s → 45s untuk Next.js SSR
const CURRENT_YEAR = new Date().getFullYear();

// ════════════════════════════════════════════════════════════════
// MONGODB
// ════════════════════════════════════════════════════════════════
const TenderSchema = new mongoose.Schema({
  lelangId:          { type: String, required: true, unique: true },
  nama_paket:        { type: String, required: true },
  instansi:          String,
  hps:               String,
  pagu:              String,
  kategori:          String,
  tag:               String,
  metode_pengadaan:  String,
  wilayah:           String,
  url_lpse:          String,
  jadwal:            [{ tahap: String, mulai: String, sampai: String, perubahan: String }],
  pinned_by_users:   { type: [String], default: [] },
  finished_at:       { type: Date },
  ai_summary:        { type: String, default: null },
  ai_summary_at:     { type: Date, default: null },
  status:            { type: String, enum: ["aktif","gagal","selesai","menang"], default: "aktif", index: true },
  archived_at:       { type: Date, default: null },
  archived_reason:   { type: String, default: null },
  archived_by:       { type: String, default: null },

  // ── Field baru dari halaman /pengumumanlelang ──────────────────
  kode_rup:          String,
  sumber_dana:       String,
  url_dok_uraian:    String,
  tanggal_pembuatan: String,
  tahap_saat_ini:    String,
  satuan_kerja:      String,
  jenis_pengadaan:   String,
  tahun_anggaran:    String,
  jenis_kontrak:     String,
  lokasi_pekerjaan:  String,
  kualifikasi_usaha: String,
  syarat_kualifikasi:String,
  jumlah_peserta:    Number,
  info_synced_at:    Date,
  url_hasil_evaluasi:String,
  url_pemenang:      String,
  url_syarat_kualifikasi: String,
  
  // ── Field Scraping Pemenang & Evaluasi (Jika Selesai) ────────────
  pemenang_nama:     String,
  pemenang_alamat:   String,
  pemenang_npwp:     String,
  pemenang_harga:    String,
  peserta_evaluasi:  [{
    nama: String,
    harga_penawaran: String,
    harga_terkoreksi: String,
    skor_teknis: String,
    lulus: Boolean,
    alasan_gagal: String
  }],
}, { timestamps: true });

const TenderModel = mongoose.models?.Tender || mongoose.model("Tender", TenderSchema);

// ── User Model (ringkas, hanya yang dibutuhkan) ──────────────────────────────
const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, required: true },
  nama_lengkap: { type: String, default: "" },
  perusahaan: { type: String, default: "" },
  provinsi: { type: String, default: "" },
  bidang_minat: { type: [String], default: [] },
  search_history: { type: [String], default: [] },
}, { timestamps: true });
const UserModel = mongoose.models?.User || mongoose.model("User", UserSchema);

// ── Pending Email Notif (antrian digest harian) ──────────────────────────────
const PendingEmailSchema = new mongoose.Schema({
  userId:     { type: String, required: true, index: true },
  userEmail:  { type: String, required: true },
  userName:   { type: String, default: "" },
  tenderId:   { type: String, required: true },
  tenderName: String,
  instansi:   String,
  wilayah:    String,
  pagu:       String,
  score:      Number,
}, { timestamps: true });
const PendingEmailModel = mongoose.models?.PendingEmailNotif || mongoose.model("PendingEmailNotif", PendingEmailSchema);

const agenda = new Agenda({ db: { address: MONGO_URI, collection: "agendaJobs" } });

// ════════════════════════════════════════════════════════════════
// UTILITAS
// ════════════════════════════════════════════════════════════════
function stripHtml(html) {
  return String(html || "").replace(/<[^>]*>?/gm, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

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

const aiCategoryCache = new Map();

async function classifyWithAIBatch(packages) {
  // Hanya ambil paket yang belum ada di cache
  const packagesToClassify = packages.filter(p => !aiCategoryCache.has(p));
  
  // Jika semua sudah di cache, langsung kembalikan dari cache
  if (packagesToClassify.length === 0) {
    return packages.reduce((acc, p) => ({...acc, [p]: aiCategoryCache.get(p)}), {});
  }
  
  if (!packagesToClassify || packagesToClassify.length === 0) return {};
  
  const apiKey = process.env.GEMINI_SCRAPER_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) return packages.reduce((acc, p) => ({...acc, [p]: "Lainnya"}), {});

  const prompt = `Tugas Anda mengklasifikasikan judul tender ke dalam HANYA salah satu kategori berikut: Teknologi, Konstruksi, Kesehatan, Pangan, Konsultansi, Pendidikan, Otomotif, Logistik, Jasa Umum. Jika sama sekali tidak masuk, kembalikan "Lainnya".

Daftar judul:
${JSON.stringify(packages)}

KEMBALIKAN HANYA SEBUAH OBJEK JSON (tanpa backticks, tanpa format markdown, tanpa penjelasan apa pun) dengan judul sebagai key dan kategori sebagai value. Contoh: {"Pengadaan laptop ASUS": "Teknologi"}`;

  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (response.status === 429) {
        console.log(`[AI] Rate limit terkena (Gemini API). Tunggu 15 detik...`);
        await new Promise(r => setTimeout(r, 15000));
        continue;
      }

      const data = await response.json();
      if (!data || !data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error(`[AI] Gemini API Error (Attempt ${attempt}):`, JSON.stringify(data));
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      
      let text = data.candidates[0].content.parts[0].text.trim();
      text = text.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
      
      const results = JSON.parse(text);
      
      // Simpan ke cache
      for (const [key, value] of Object.entries(results)) {
        aiCategoryCache.set(key, value);
      }
      
      // Gabungkan dengan hasil dari cache untuk paket yang tidak di-fetch ulang
      return packages.reduce((acc, p) => ({
        ...acc, 
        [p]: aiCategoryCache.get(p) || results[p] || "Lainnya"
      }), {});
      
    }
    throw new Error("Rate limit exceeded after retries");
  } catch (err) {
    console.log("[AI] Gagal klasifikasi:", err.message);
    return packages.reduce((acc, p) => ({...acc, [p]: aiCategoryCache.get(p) || "Lainnya"}), {});
  }
}

// Simpan batch ke MongoDB
async function saveBatch(items) {
  if (!items.length) return { inserted: 0, updated: 0 };
  
  let insertedCount = 0;
  let updatedCount = 0;

  for (const row of items) {
    const existing = await TenderModel.findOne({ lelangId: row.lelangId }).select("archived_at").lean();
    
    // Set archived_at if status is selesai and no archived_at yet
    if (row.status === "selesai" && (!existing || !existing.archived_at)) {
      row.archived_at = new Date();
      row.finished_at = new Date();
      row.archived_reason = "Tender telah selesai";
    }

    const result = await TenderModel.updateOne(
      { lelangId: row.lelangId },
      { $set: row },
      { upsert: true }
    );
    
    if (result.upsertedCount > 0) {
      insertedCount++;
    } else if (result.modifiedCount > 0) {
      updatedCount++;
    }
  }
  return { inserted: insertedCount, updated: updatedCount };
}

// ════════════════════════════════════════════════════════════════
// SCRAPER SATU LPSE — v4 (DOM Scraping Next.js)
// ════════════════════════════════════════════════════════════════
async function scrapeSingleLpse(lpse, browser) {
  let slug;
  try {
    const u = new URL(lpse.url.startsWith("http") ? lpse.url : `https://${lpse.url}`);
    slug = u.hostname === "spse.inaproc.id"
      ? u.pathname.replace(/^\//, "").split("/")[0]
      : u.hostname.replace(".go.id", "").replace("lpse.", "").replace("spse.", "");
  } catch {
    return [];
  }

  const listUrl = `${BASE_DOMAIN}/${slug}/lelang`;
  const collectedRows = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({ "Accept-Language": "id-ID,id;q=0.9" });

    await page.goto(listUrl, { waitUntil: "networkidle2", timeout: NAV_TIMEOUT });
    await new Promise(r => setTimeout(r, PAGE_WAIT_MS));

    for (let p = 0; p < PAGES_PER_LPSE; p++) {
      const rows = await page.evaluate((slug, baseDomain) => {
        const results = [];
        const tableRows = Array.from(document.querySelectorAll("table tbody tr, tbody tr"));

        for (const tr of tableRows) {
          const cells = Array.from(tr.querySelectorAll("td"));
          if (cells.length < 3) continue;

          const kodeCell = cells[0];
          const lelangId = kodeCell?.innerText?.trim().replace(/\D/g, "") || "";
          if (!lelangId || lelangId.length < 5) continue;

          const namaCell = cells[1];
          const cellText = namaCell?.innerHTML?.toLowerCase() || "";
          const isBatalGagal = (cellText.includes("tender batal") || cellText.includes("tender gagal") || (cellText.includes("label-danger") && (cellText.includes("batal") || cellText.includes("gagal"))));
          if (isBatalGagal) continue;

          const linkEl = namaCell?.querySelector("a");
          const namaPaket = linkEl?.innerText?.trim() || namaCell?.querySelector("div, span, p")?.innerText?.trim() || "";
          if (!namaPaket || namaPaket.length < 5) continue;

          const allLines = namaCell?.innerText?.split("\n").map(s => s.trim()).filter(Boolean) || [];
          const metodeLine = allLines.find(l => l.toLowerCase().includes("tender") || l.toLowerCase().includes("seleksi") || l.toLowerCase().includes("pengadaan")) || "";
          const instansi = cells[2]?.innerText?.trim() || "";
          const tahapan = cells[3]?.innerText?.trim() || "";
          const hpsRaw = cells[4]?.innerText?.trim() || "N/A";

          results.push({ lelangId, nama_paket: namaPaket, instansi, tahap_saat_ini: tahapan, hps: hpsRaw, metode_detail: metodeLine, url_lpse: `${baseDomain}/${slug}` });
        }
        return results;
      }, slug, BASE_DOMAIN);

      for (const row of rows) {
        const { tag, kategori } = classifyPaket(row.nama_paket);
        
        const parsed = classifyPaket(row.nama_paket);
        const tahapStr = (row.tahap_saat_ini || "").toLowerCase();
        const isFinished = tahapStr.includes("selesai") || tahapStr.includes("pemenang");
        
        const payload = {
          lelangId:         row.lelangId,
          nama_paket:       row.nama_paket,
          instansi:         row.instansi || lpse.nama,
          hps:              row.hps,
          pagu:             row.hps,
          kategori:         "Jasa",
          tag:              parsed.tag,
          metode_pengadaan: row.metode_detail || "Tender",
          tahap_saat_ini:   row.tahap_saat_ini,
          wilayah:          lpse.nama,
          url_lpse:         row.url_lpse,
        };

        if (isFinished) {
          payload.status = "selesai";
          // Jika background scraper yang pertama kali deteksi, catat finished_at
          // Nanti sync-info akan memperbarui dengan hasil evaluasi
        }

        collectedRows.push(payload);
      }

      if (p < PAGES_PER_LPSE - 1) {
        try {
          const nextBtn = await page.$("button[aria-label='Next'], a[aria-label='Next'], li.next:not(.disabled) a");
          if (!nextBtn) break;
          const isDisabled = await page.evaluate(el => el.disabled || el.classList.contains("disabled") || el.closest("li")?.classList.contains("disabled"), nextBtn);
          if (isDisabled) break;
          await nextBtn.click();
          await new Promise(r => setTimeout(r, PAGE_WAIT_MS));
        } catch { break; }
      }
    }
    await page.close();
  } catch (err) {
    process.stderr.write(`\n  ✗ ${lpse.nama}: ${err.message.substring(0, 80)}\n`);
  }
  return collectedRows;
}

// ════════════════════════════════════════════════════════════════
// BATCH SCRAPER
// ════════════════════════════════════════════════════════════════
async function scrapeBatch(batch, progressObj) {
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
    protocolTimeout: 120000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--ignore-certificate-errors", "--disable-web-security", "--disable-gpu", "--disable-software-rasterizer"],
  });
  try {
    for (const lpse of batch) {
      const startTime = Date.now();
      const items = await scrapeSingleLpse(lpse, browser);

      // AI Fallback Logic
      const lainnyaItems = items.filter(i => i.tag === "Lainnya");
      const apiKey = process.env.GEMINI_SCRAPER_KEY || process.env.GEMINI_API_KEY;
      if (lainnyaItems.length > 0 && apiKey) {
        // Filter nama paket unik untuk diproses
        const packageNames = [...new Set(lainnyaItems.map(i => i.nama_paket))];
        const uncachedCount = packageNames.filter(p => !aiCategoryCache.has(p)).length;
        
        if (uncachedCount > 0) {
          console.log(`[AI] ${lpse.nama}: Memanggil Gemini untuk ${uncachedCount} item baru ('Lainnya')...`);
        }
        
        const CHUNK_SIZE = 150;
        for (let i = 0; i < packageNames.length; i += CHUNK_SIZE) {
          const chunk = packageNames.slice(i, i + CHUNK_SIZE);
          
          // Hanya panggil AI jika ada item di chunk yang belum di-cache
          if (chunk.some(p => !aiCategoryCache.has(p))) {
            const aiResults = await classifyWithAIBatch(chunk);
            
            for (const item of lainnyaItems) {
              if (aiResults[item.nama_paket] && aiResults[item.nama_paket] !== "Lainnya") {
                item.tag = aiResults[item.nama_paket];
              }
            }
            
            // Tambahkan jeda yang lebih lama antar chunk untuk model gratis
            if (i + CHUNK_SIZE < packageNames.length) {
              await new Promise(r => setTimeout(r, 10000));
            }
          } else {
             // Jika semua sudah di cache, langsung update tag
             for (const item of lainnyaItems) {
               if (aiCategoryCache.has(item.nama_paket) && aiCategoryCache.get(item.nama_paket) !== "Lainnya") {
                 item.tag = aiCategoryCache.get(item.nama_paket);
               }
             }
          }
        }
      }

      progressObj.done++;
      const timeSec = ((Date.now() - startTime) / 1000).toFixed(1);
      const lpName = lpse.nama.padEnd(40, " ");
      if (items.length > 0) {
        const { inserted, updated } = await saveBatch(items);
        progressObj.inserted += inserted;
        progressObj.updated += updated;
        console.log(`[✓] ${lpName} | +${String(inserted).padEnd(3, " ")} baru | ~${String(updated).padEnd(3, " ")} update | ${timeSec}s`);
      } else {
        progressObj.failed++;
        console.log(`[!] ${lpName} | Kosong / Gagal             | ${timeSec}s`);
      }
    }
  } finally {
    await browser.close();
  }
}

// ════════════════════════════════════════════════════════════════
// AGENDA JOBS
// ════════════════════════════════════════════════════════════════
agenda.define("scrape all lpse", async () => {
  const t0 = Date.now();
  console.log(`\n${"═".repeat(65)}`);
  console.log(`📡  SCRAPE ${LPSE_LIST.length} LPSE SELURUH INDONESIA`);
  console.log(`    Parallel browsers: ${BROWSER_CONCURRENCY} | Halaman/LPSE: ${PAGES_PER_LPSE}`);
  console.log(`${"═".repeat(65)}`);

  const LPSE_PER_BROWSER = Math.ceil(LPSE_LIST.length / BROWSER_CONCURRENCY);
  const batches = [];
  for (let i = 0; i < LPSE_LIST.length; i += LPSE_PER_BROWSER) batches.push(LPSE_LIST.slice(i, i + LPSE_PER_BROWSER));

  const progressObj = { done: 0, inserted: 0, updated: 0, failed: 0 };
  await Promise.allSettled(batches.map(batch => scrapeBatch(batch, progressObj)));

  const elapsed = ((Date.now() - t0) / 1000 / 60).toFixed(1);
  console.log(`\n${"═".repeat(65)}`);
  console.log(`✅  Selesai ${elapsed} menit`);
  console.log(`    Data baru: ${progressObj.inserted} | Update: ${progressObj.updated} | Gagal: ${progressObj.failed}`);
  console.log(`${"═".repeat(65)}\n`);
});

agenda.define("sync jadwal aktif", async () => {
  console.log(`\n📅  Sync jadwal tender aktif...`);
  const tenders = await TenderModel.find({ url_lpse: { $exists: true, $ne: "" }, lelangId: { $not: /^PKG-/ }, status: "aktif" }).select("lelangId url_lpse").lean();
  let synced = 0;
  
  let browser;
  const launchBrowser = async () => {
    if (browser) await browser.close().catch(() => {});
    return await puppeteer.launch({ headless: true, protocolTimeout: 120000, ignoreHTTPSErrors: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--disable-software-rasterizer"] });
  };
  
  browser = await launchBrowser();

  for (let i = 0; i < tenders.length; i++) {
    const tender = tenders[i];
    // Restart browser secara berkala untuk mencegah OOM / Crash
    if (i > 0 && i % 100 === 0) {
      browser = await launchBrowser();
    }

    try {
      const { url_lpse, lelangId } = tender;
      const slug = new URL(url_lpse).pathname.replace(/^\//, "").split("/")[0] || url_lpse.split("/")[3];
      const jadwalUrl = `${BASE_DOMAIN}/${slug}/lelang/${lelangId}/jadwal`;
      const page = await browser.newPage();
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
      await page.goto(jadwalUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
      await new Promise(r => setTimeout(r, 1000));

      const jadwalRows = await page.evaluate(() => {
        const trs = Array.from(document.querySelectorAll("table.table tbody tr, table tbody tr"));
        return trs.map(tr => {
          const tds = Array.from(tr.querySelectorAll("td,th")).map(td => td.innerText?.trim() || "");
          if (tds.length >= 4 && tds[1] && !tds[1].toLowerCase().includes("tahap")) return { tahap: tds[1], mulai: tds[2], sampai: tds[3], perubahan: tds[4] || "Tidak Ada" };
          return null;
        }).filter(Boolean);
      });
      await page.close();
      if (jadwalRows.length > 0) {
        await TenderModel.updateOne({ lelangId }, { $set: { jadwal: jadwalRows } });
        synced++;
      }
    } catch (err) {
      console.error(`[-] Gagal sync jadwal ${tender.lelangId}:`, err.message);
      // Jika error adalah browser disconnect, kita harus restart browsernya
      if (err.message.includes("Connection closed") || err.message.includes("Target closed") || err.message.includes("Session closed")) {
        console.log(`[!] Browser crashed, restarting...`);
        browser = await launchBrowser();
      }
    }
    if (synced % 10 === 0) await new Promise(r => setTimeout(r, 500));
  }
  if (browser) await browser.close().catch(() => {});
  console.log(`✅  Jadwal sync: ${synced}/${tenders.length} diperbarui\n`);
});

agenda.define("cleanup expired tenders", async () => {
  console.log(`\n🗑️   Cleanup tender kadaluarsa...`);
  const now = Date.now();
  const GRACE = 7 * 24 * 60 * 60 * 1000;
  const mo = {Januari:"01",Februari:"02",Maret:"03",April:"04",Mei:"05",Juni:"06",Juli:"07",Agustus:"08",September:"09",Oktober:"10",November:"11",Desember:"12"};
  const parseDate = (s) => {
    const m = s?.trim().match(/^(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+(\d{2}:\d{2}))?/);
    if (m) {
      const d = new Date(`${m[3]}-${mo[m[2]]||"01"}-${m[1].padStart(2,"0")}T${m[4]||"23:59"}:00+07:00`);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };
  const tenders = await TenderModel.find({ "jadwal.0": { $exists: true }, pinned_by_users: { $size: 0 }, status: "aktif" }).lean();
  let deleted = 0;
  for (const t of tenders) {
    let latest = null;
    for (const step of t.jadwal || []) {
      const d = parseDate(step.sampai || "");
      if (d && (!latest || d > latest)) latest = d;
    }
    if (latest && (latest.getTime() + GRACE) < now) {
      await TenderModel.deleteOne({ _id: t._id });
      deleted++;
    }
  }
  console.log(`✅  Cleanup: ${deleted} tender dihapus\n`);
});

agenda.define("deep sync tender details", async () => {
  console.log(`\n🔍  Deep Sync: Mengambil detail tender perlahan...`);
  // Cari 10 tender aktif yang belum punya tanggal pembuatan (tender baru)
  const tenders = await TenderModel.find({
    status: "aktif",
    $or: [{ tanggal_pembuatan: null }, { tanggal_pembuatan: { $exists: false } }]
  }).sort({ createdAt: -1 }).limit(10).lean();

  if (tenders.length === 0) {
    console.log(`✅  Deep Sync: Tidak ada tender baru yang butuh di-sync saat ini.`);
    return;
  }

  console.log(`    Ditemukan ${tenders.length} tender untuk di-sync.`);
  let successCount = 0;

  for (const tender of tenders) {
    try {
      const url = `http://localhost:3000/api/tenders/sync-info/${tender.lelangId}?url_lpse=${encodeURIComponent(tender.url_lpse || "")}`;
      const res = await fetch(url);
      if (res.ok) {
        successCount++;
        console.log(`    [+] Detail tersinkronisasi: ${tender.lelangId}`);
      } else {
        console.log(`    [-] Gagal sinkronisasi: ${tender.lelangId} (HTTP ${res.status})`);
      }
    } catch (err) {
      console.log(`    [-] Error sinkronisasi: ${tender.lelangId} - ${err.message}`);
    }
    // Delay 4 detik agar tidak memicu pemblokiran IP (WAF LPSE)
    await new Promise(r => setTimeout(r, 4000));
  }
  
  console.log(`✅  Deep Sync: Berhasil meng-update ${successCount}/${tenders.length} tender.\n`);
});

// ════════════════════════════════════════════════════════════════
// JOB: QUEUE EMAIL NOTIFICATIONS (berjalan setelah setiap scrape)
// Mencocokkan tender baru dengan profil semua user
// ════════════════════════════════════════════════════════════════
agenda.define("queue email notifications", async () => {
  console.log("📧  [Email] Mengecek tender baru untuk notifikasi email...");
  try {
    // Cari tender yang dibuat dalam 35 menit terakhir (sedikit lebih dari interval scrape)
    const since = new Date(Date.now() - 35 * 60 * 1000);
    const newTenders = await TenderModel.find(
      { createdAt: { $gt: since }, status: "aktif" },
      { nama_paket: 1, instansi: 1, wilayah: 1, kategori: 1, tag: 1, pagu: 1 }
    ).limit(100).lean();

    if (newTenders.length === 0) {
      console.log("📧  [Email] Tidak ada tender baru. Dilewati.");
      return;
    }

    const allUsers = await UserModel.find({}, { email: 1, nama_lengkap: 1, perusahaan: 1, provinsi: 1, bidang_minat: 1, search_history: 1 }).lean();
    let queued = 0;

    for (const user of allUsers) {
      if (!user.email) continue;

      for (const tender of newTenders) {
        // Hitung skor relevansi sederhana
        let score = 0;
        const namaPaket = (tender.nama_paket || "").toLowerCase();
        const tenderStr = ((tender.wilayah || "") + " " + (tender.instansi || "")).toLowerCase();
        const prov = (user.provinsi || "").toLowerCase();

        if (prov && tenderStr.includes(prov)) score += 35;
        if ((user.bidang_minat || []).some(b =>
          (tender.kategori || "").toLowerCase().includes(b.toLowerCase()) ||
          namaPaket.includes(b.toLowerCase())
        )) score += 30;
        if ((user.search_history || []).some(kw => kw.length > 2 && namaPaket.includes(kw.toLowerCase()))) score += 25;

        if (score < 50) continue; // Hanya yang relevan

        // Cek apakah sudah ada di queue (hindari duplikat)
        const exists = await PendingEmailModel.exists({ userId: String(user._id), tenderId: String(tender._id) });
        if (exists) continue;

        await PendingEmailModel.create({
          userId: String(user._id),
          userEmail: user.email,
          userName: user.nama_lengkap || user.perusahaan || "",
          tenderId: String(tender._id),
          tenderName: tender.nama_paket,
          instansi: tender.instansi,
          wilayah: tender.wilayah,
          pagu: tender.pagu,
          score,
        });
        queued++;
      }
    }
    console.log(`📧  [Email] ${queued} notifikasi baru dimasukkan ke antrian digest.`);
  } catch (err) {
    console.error("📧  [Email] Gagal queue notifikasi:", err.message);
  }
});

// ════════════════════════════════════════════════════════════════
// JOB: SEND DAILY DIGEST — Setiap hari jam 07:00 WIB
// Mengirim 1 email rekap per user dari antrian
// ════════════════════════════════════════════════════════════════
agenda.define("send daily digest", async () => {
  console.log("📨  [Daily Digest] Memulai pengiriman email rekap harian...");
  try {
    const pending = await PendingEmailModel.find({}).lean();
    if (pending.length === 0) {
      console.log("📨  [Daily Digest] Tidak ada email dalam antrian.");
      return;
    }

    // Kelompokkan per user
    const byUser = {};
    for (const p of pending) {
      if (!byUser[p.userId]) {
        byUser[p.userId] = { email: p.userEmail, name: p.userName, tenders: [] };
      }
      byUser[p.userId].tenders.push(p);
    }

    let sentCount = 0;
    const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    for (const [userId, data] of Object.entries(byUser)) {
      try {
        const html = buildDailyDigestHtml(
          { nama_lengkap: data.name },
          data.tenders
        );

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: `"Seleno Platform" <${process.env.EMAIL_USER}>`,
          to: data.email,
          subject: `[Daily Digest] ${data.tenders.length} Tender Baru untuk Anda (${today})`,
          html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        
        sentCount++;
        console.log(`📨  [Digest] ✅ Terkirim ke ${data.email} (${data.tenders.length} tender) ID: ${info.messageId}`);
        // Hapus dari queue setelah berhasil
        await PendingEmailModel.deleteMany({ userId });

      } catch (err) {
        console.error(`📨  [Digest] Error kirim ke ${data.email}:`, err.message);
      }
    }

    console.log(`📨  [Daily Digest] Selesai. ${sentCount}/${Object.keys(byUser).length} email terkirim.\n`);
  } catch (err) {
    console.error("📨  [Daily Digest] Gagal:", err.message);
  }
});

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════
async function main() {
  console.log("━".repeat(65));
  console.log("🚀  LPSE SCRAPER — MULTI DAERAH INDONESIA v4 (DOM Scraping)");
  console.log(`    Daftar: ${LPSE_LIST.length} LPSE | Browsers: ${BROWSER_CONCURRENCY}`);
  console.log(`    Target: ${BASE_DOMAIN}/{slug}/lelang (Next.js SSR)`);
  console.log("━".repeat(65));

  await mongoose.connect(MONGO_URI);
  console.log(`✅  MongoDB: ${MONGO_URI}`);

  // Hapus semua job yang tersangkut dari sesi sebelumnya agar RAM tidak jebol
  await mongoose.connection.collection("agendaJobs").deleteMany({});
  console.log("🗑️   Antrean job lama berhasil dibersihkan");

  await agenda.start();
  console.log("✅  Agenda queue aktif\n");

  await agenda.every("30 minutes", "scrape all lpse");
  await agenda.every("15 minutes", "sync jadwal aktif");
  await agenda.every("5 minutes",  "deep sync tender details");
  await agenda.every("3 hours",    "cleanup expired tenders");
  await agenda.every("30 minutes", "queue email notifications");  // Jalankan setelah setiap scrape
  await agenda.every("0 0 * * *", "send daily digest");        // Setiap hari jam 07:00 WIB (00:00 UTC)

  console.log("📅  Jadwal scraper:");
  console.log("    ├─ Scrape semua LPSE  : tiap 30 menit");
  console.log("    ├─ Sync jadwal aktif  : tiap 15 menit");
  console.log("    ├─ Deep sync detail   : tiap 5 menit");
  console.log("    ├─ Cleanup expired    : tiap 3 jam");
  console.log("    ├─ Queue email notif  : tiap 30 menit");
  console.log("    └─ Daily Digest email : setiap hari 07:00 WIB\n");

  await agenda.now("scrape all lpse");
  console.log("⚡  Scraping perdana dimulai...");
  console.log("⏳  Tekan Ctrl+C untuk berhenti.\n");
}

main().catch(err => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
