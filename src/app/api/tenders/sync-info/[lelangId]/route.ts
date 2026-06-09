import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import puppeteer from "puppeteer";

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/seleno_db";
const BASE_DOMAIN = "https://spse.inaproc.id";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 jam

// ── Mongoose Model (reuse schema dari scraper) ──────────────────
let TenderModel: any;
async function getModel() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
  if (mongoose.models.Tender) return mongoose.models.Tender;
  const schema = new mongoose.Schema({}, { strict: false, timestamps: true });
  return mongoose.model("Tender", schema);
}

// ── Puppeteer: Scrape halaman /pengumumanlelang ─────────────────
async function scrapeInfoTender(slug: string, lelangId: string): Promise<Record<string, any>> {
  const url = `${BASE_DOMAIN}/${slug}/lelang/${lelangId}/pengumumanlelang`;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    // LPSE memblokir akses langsung tanpa Referer
    await page.setExtraHTTPHeaders({
      "Referer": `${BASE_DOMAIN}/${slug}/lelang`,
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
    });
    
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 3000));

    const data = await page.evaluate(() => {
      const result: Record<string, any> = {};

      // Helper: cari nilai label di tabel (support berbagai layout)
      const findByLabel = (label: string): string => {
        // Cari <td> atau <th> yang mengandung teks label, ambil td berikutnya
        const allCells = Array.from(document.querySelectorAll("td, th"));
        for (const cell of allCells) {
          const text = cell.textContent?.trim() || "";
          if (text.toLowerCase().includes(label.toLowerCase())) {
            // Ambil sibling td berikutnya atau td di baris yang sama
            const nextSibling = cell.nextElementSibling;
            if (nextSibling?.tagName === "TD") {
              return nextSibling.textContent?.trim() || "";
            }
            // Coba ambil td kedua di tr yang sama
            const parentTr = cell.closest("tr");
            if (parentTr) {
              const tds = Array.from(parentTr.querySelectorAll("td"));
              if (tds.length >= 2) return tds[tds.length - 1].textContent?.trim() || "";
            }
          }
        }
        return "";
      };

      // ── Kode Tender (lelangId konfirmasi)
      result.kode_rup = findByLabel("Kode RUP") || findByLabel("kode rup");

      // ── Sumber Dana
      result.sumber_dana = findByLabel("Sumber Dana") || findByLabel("sumber dana");

      // ── Tanggal Pembuatan
      result.tanggal_pembuatan = findByLabel("Tanggal Pembuatan") || findByLabel("tanggal pembuatan");

      // ── Tahap Saat Ini
      result.tahap_saat_ini = findByLabel("Tahap Tender Saat Ini") || findByLabel("tahap tender");

      // ── K/L/PD
      result.instansi_klpd = findByLabel("K/L/PD") || findByLabel("K/L/PD/Instansi");

      // ── Satuan Kerja
      result.satuan_kerja = findByLabel("Satuan Kerja");

      // ── Jenis Pengadaan
      result.jenis_pengadaan = findByLabel("Jenis Pengadaan");

      // ── Metode Pengadaan (detail)
      result.metode_pengadaan = findByLabel("Metode Pengadaan");

      // ── Tahun Anggaran
      result.tahun_anggaran = findByLabel("Tahun Anggaran");

      // ── Nilai Pagu
      result.pagu = findByLabel("Nilai Pagu Paket");

      // ── Nilai HPS
      result.hps = findByLabel("Nilai HPS Paket");

      // ── Jenis Kontrak
      result.jenis_kontrak = findByLabel("Jenis Kontrak");

      // ── Lokasi Pekerjaan
      result.lokasi_pekerjaan = findByLabel("Lokasi Pekerjaan");

      // ── Kualifikasi Usaha
      result.kualifikasi_usaha = findByLabel("Kualifikasi Usaha");

      // ── Alasan Diulang / Batal
      result.alasan_diulang = findByLabel("Alasan di ulang") || findByLabel("alasan di ulang") || findByLabel("Alasan pembatalan") || findByLabel("alasan pembatalan");

      // ── Syarat Kualifikasi (teks panjang - cari section khusus)
      let syaratKualifikasi = "";
      const allTh = Array.from(document.querySelectorAll("th"));
      
      // Cari th yang teksnya PERSIS "Syarat Kualifikasi" atau "Persyaratan Kualifikasi"
      const targetTh = allTh.find(th => {
        const text = th.textContent?.trim().toLowerCase() || "";
        return text === "syarat kualifikasi" || text === "persyaratan kualifikasi";
      });

      if (targetTh) {
        let extractedHtml = "";
        
        // 1. Ambil baris pertama secara utuh
        if (targetTh.parentElement) {
          extractedHtml += targetTh.parentElement.outerHTML;
        }
        
        // 2. Ambil baris-baris berikutnya sampai ketemu section baru (<th> lain di awal baris)
        let currentTr = targetTh.parentElement?.nextElementSibling;
        while (currentTr) {
          const firstChild = currentTr.firstElementChild;
          if (firstChild && firstChild.tagName === "TH" && !firstChild.hasAttribute("colspan")) {
            // Jika ketemu th di awal baris, berarti masuk section baru (misal: "Peserta Tender")
            break;
          }
          extractedHtml += currentTr.outerHTML;
          currentTr = currentTr.nextElementSibling;
        }
        
        // Bungkus dengan table agar HTML-nya valid dan rapi
        syaratKualifikasi = `<div class="lpse-syarat-table-container"><table class="w-full text-xs border-collapse"><tbody>${extractedHtml}</tbody></table></div>`;
      }

      // Fallback jika tidak ketemu
      if (!syaratKualifikasi) {
        const allThTd = Array.from(document.querySelectorAll("td, th"));
        for (const cell of allThTd) {
          if (cell.textContent?.trim().toLowerCase() === "syarat kualifikasi") {
            const parentTr = cell.closest("tr");
            if (parentTr) {
              syaratKualifikasi = `<div class="lpse-syarat-table-container"><table class="w-full text-xs border-collapse"><tbody>${parentTr.outerHTML}</tbody></table></div>`;
            }
            break;
          }
        }
      }
      // Hapus batasan substring 3000 karena HTML jauh lebih panjang
      result.syarat_kualifikasi = syaratKualifikasi;

      // ── Peserta Tender
      const pesertaText = findByLabel("Peserta Tender");
      const pesertaMatch = pesertaText.match(/(\d+)/);
      result.jumlah_peserta = pesertaMatch ? parseInt(pesertaMatch[1]) : 0;

      // ── URL Dokumen Uraian (cari link PDF)
      const pdfLinks = Array.from(document.querySelectorAll("a[href*='.pdf'], a[href*='uraian']"));
      if (pdfLinks.length > 0) {
        result.url_dok_uraian = (pdfLinks[0] as HTMLAnchorElement).href || "";
      }

      // ── URL Navigasi Tab (Evaluasi, Pemenang, Syarat Kualifikasi)
      const navLinks = Array.from(document.querySelectorAll("ul.nav.nav-tabs li a, .nav a, .nav-tabs a"));
      for (const link of navLinks) {
        const text = link.textContent?.trim().toLowerCase() || "";
        const href = (link as HTMLAnchorElement).href;
        if (text.includes("hasil evaluasi")) result.url_hasil_evaluasi = href;
        if (text.includes("pemenang") && !text.includes("berkontrak")) result.url_pemenang = href;
        if (text.includes("syarat kualifikasi")) result.url_syarat_kualifikasi = href;
      }

      return result;
    });

    // ── Ekstraksi Pemenang ──
    const tahap = String(data.tahap_saat_ini || "").toLowerCase();
    const isFinished = tahap.includes("selesai") || tahap.includes("pemenang");

    if (isFinished || data.url_pemenang) {
      if (isFinished) data.status = "selesai";
      const urlPemenang = (typeof data.url_pemenang === "string" && data.url_pemenang) ? data.url_pemenang : `${BASE_DOMAIN}/${slug}/evaluasi/${lelangId}/pemenang`;

      try {
        await page.goto(urlPemenang, { waitUntil: "domcontentloaded", timeout: 25000 });
        
        const pemenangData = await page.evaluate(() => {
          const res: any = {};
          const elements = Array.from(document.querySelectorAll("th, td"));
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            const text = el.textContent?.trim().toLowerCase() || "";
            let valueEl = el.nextElementSibling;
            if (valueEl && valueEl.tagName === "TD" && valueEl.textContent?.trim() === ":") {
              valueEl = valueEl.nextElementSibling;
            }
            if (valueEl && valueEl.tagName === "TD") {
              if (text.includes("nama pemenang") || text === "nama penyedia") res.pemenang_nama = valueEl.textContent?.replace(/\s+/g, " ").trim() || "";
              else if (text.includes("alamat")) res.pemenang_alamat = valueEl.textContent?.replace(/\s+/g, " ").trim() || "";
              else if (text.includes("npwp")) res.pemenang_npwp = valueEl.textContent?.replace(/\s+/g, " ").trim() || "";
              else if (text.includes("harga penawaran") || text.includes("harga terkoreksi")) res.pemenang_harga = valueEl.textContent?.replace(/\s+/g, " ").trim() || "";
            }
          }

          if (!res.pemenang_nama) {
            const ths = Array.from(document.querySelectorAll("th"));
            const thNamaIndex = ths.findIndex(th => { const t = th.textContent?.trim().toLowerCase() || ""; return t.includes("nama pemenang") || t === "nama penyedia"; });
            
            if (thNamaIndex !== -1) {
              const thNamaEl = ths[thNamaIndex] as HTMLTableCellElement;
              const cellIndex = thNamaEl.cellIndex;
              let nextTr = thNamaEl.parentElement?.nextElementSibling;
              if (!nextTr && thNamaEl.closest("thead")) {
                nextTr = thNamaEl.closest("table")?.querySelector("tbody tr");
              }
              
              if (nextTr) {
                const tds = Array.from(nextTr.querySelectorAll("td"));
                if (tds[cellIndex]) res.pemenang_nama = tds[cellIndex].textContent?.replace(/\s+/g, " ").trim();
                
                const thAlamatEl = thNamaEl.parentElement?.querySelector("th:nth-child(" + (cellIndex + 2) + ")");
                const thAlamatText = thAlamatEl?.textContent?.trim().toLowerCase() || "";
                if (thAlamatText.includes("alamat")) res.pemenang_alamat = tds[cellIndex + 1]?.textContent?.replace(/\s+/g, " ").trim();

                const thNpwpEl = thNamaEl.parentElement?.querySelector("th:nth-child(" + (cellIndex + 3) + ")");
                const thNpwpText = thNpwpEl?.textContent?.trim().toLowerCase() || "";
                if (thNpwpText.includes("npwp")) res.pemenang_npwp = tds[cellIndex + 2]?.textContent?.replace(/\s+/g, " ").trim();

                const thHargaEl = thNamaEl.parentElement?.querySelector("th:nth-child(" + (cellIndex + 4) + ")");
                const thHargaText = thHargaEl?.textContent?.trim().toLowerCase() || "";
                if (thHargaText.includes("harga")) res.pemenang_harga = tds[cellIndex + 3]?.textContent?.replace(/\s+/g, " ").trim();
              }
            }
          }
          return res;
        });
        Object.assign(data, pemenangData);
      } catch (e) {
        console.log("[sync-info] Gagal scrape pemenang:", e);
      }
    }

    // ── Ekstraksi Hasil Evaluasi ──
    const hasEvaluasiTab = !!data.url_hasil_evaluasi;
    const isEvaluasiStage = tahap.includes("evaluasi") || tahap.includes("penetapan") || tahap.includes("sanggah") || isFinished;

    if (hasEvaluasiTab || isEvaluasiStage) {
      const urlEvaluasi = (typeof data.url_hasil_evaluasi === "string" && data.url_hasil_evaluasi) ? data.url_hasil_evaluasi : `${BASE_DOMAIN}/${slug}/evaluasi/${lelangId}/hasil`;
      try {
        await page.goto(urlEvaluasi, { waitUntil: "domcontentloaded", timeout: 25000 });
        const evaluasiData = await page.evaluate(() => {
          const table = document.querySelector("table");
          if (!table) return null;

          const ths = Array.from(table.querySelectorAll("thead th"));
          const headers = ths.map(th => th.textContent?.trim() || "");
          
          const rows = Array.from(table.querySelectorAll("tbody tr"));
          const dataRows = rows.map(tr => {
            const tds = Array.from(tr.querySelectorAll("td"));
            return tds.map(td => {
              // Extract text and remove excess newlines/spaces
              const text = td.textContent?.replace(/\s+/g, " ").trim() || "";
              
              // Extract icon state
              const hasCheck = td.querySelector("i.fa-check, img[src*='check'], .text-success") !== null;
              const hasCross = td.querySelector("i.fa-times, img[src*='cross'], .text-danger") !== null;
              const hasStar = td.querySelector("i.fa-star, img[src*='star'], i.fa-trophy") !== null;
              
              return {
                text,
                hasCheck,
                hasCross,
                hasStar
              };
            });
          });

          return { headers, rows: dataRows };
        });
        data.peserta_evaluasi = evaluasiData;
      } catch (e) {
        console.log("[sync-info] Gagal scrape evaluasi:", e);
      }
    }

    await page.close();
    return data;
  } finally {
    await browser.close();
  }
}

// ── GET Handler ─────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lelangId: string }> }
) {
  const { lelangId } = await params;
  const url_lpse = request.nextUrl.searchParams.get("url_lpse") || "";

  if (!lelangId) {
    return NextResponse.json({ error: "lelangId diperlukan" }, { status: 400 });
  }

  try {
    TenderModel = await getModel();

    // Cari di MongoDB dulu
    const tender = await TenderModel.findOne({ lelangId }).lean() as any;

    const tahapSaatIniDB = String(tender?.tahap_saat_ini || "").toLowerCase();
    const isFinishedInDB = tahapSaatIniDB.includes("selesai") || tahapSaatIniDB.includes("pemenang");
    const needsStatusUpdate = isFinishedInDB && tender?.status !== "selesai";
    const missingWinnerData = tender?.status === "selesai" && !tender?.pemenang_nama;
    const missingSyaratHtml = tender?.syarat_kualifikasi && !tender.syarat_kualifikasi.includes("<table");
    
    // Cek apakah tender sudah di tahap evaluasi/selesai tapi data evaluasi masih kosong
    const isEvaluasiStageDB = tahapSaatIniDB.includes("evaluasi") || tahapSaatIniDB.includes("penetapan") || tahapSaatIniDB.includes("sanggah") || isFinishedInDB;
    const missingEvaluasiData = isEvaluasiStageDB && (!tender?.peserta_evaluasi || !tender.peserta_evaluasi.rows || tender.peserta_evaluasi.rows.length === 0);

    // Jika sudah ada data dan masih segar (< 24 jam), DAN tidak membutuhkan update status/data pemenang, kembalikan langsung
    if (
      !needsStatusUpdate &&
      !missingWinnerData &&
      !missingSyaratHtml &&
      !missingEvaluasiData &&
      tender?.info_synced_at &&
      tender?.satuan_kerja &&
      Date.now() - new Date(tender.info_synced_at).getTime() < CACHE_DURATION_MS
    ) {
      return NextResponse.json({
        source: "database",
        data: {
          kode_rup:          tender.kode_rup,
          sumber_dana:       tender.sumber_dana,
          url_dok_uraian:    tender.url_dok_uraian,
          tanggal_pembuatan: tender.tanggal_pembuatan,
          tahap_saat_ini:    tender.tahap_saat_ini,
          satuan_kerja:      tender.satuan_kerja,
          jenis_pengadaan:   tender.jenis_pengadaan,
          tahun_anggaran:    tender.tahun_anggaran,
          jenis_kontrak:     tender.jenis_kontrak,
          lokasi_pekerjaan:  tender.lokasi_pekerjaan,
          kualifikasi_usaha: tender.kualifikasi_usaha,
          syarat_kualifikasi:tender.syarat_kualifikasi,
          jumlah_peserta:    tender.jumlah_peserta,
          metode_pengadaan:  tender.metode_pengadaan,
          hps:               tender.hps,
          pagu:              tender.pagu,
          alasan_diulang:    tender.alasan_diulang,
          info_synced_at:    tender.info_synced_at,
          url_hasil_evaluasi:tender.url_hasil_evaluasi,
          url_pemenang:      tender.url_pemenang,
          url_syarat_kualifikasi: tender.url_syarat_kualifikasi,
          pemenang_nama:     tender.pemenang_nama,
          pemenang_alamat:   tender.pemenang_alamat,
          pemenang_npwp:     tender.pemenang_npwp,
          pemenang_harga:    tender.pemenang_harga,
          peserta_evaluasi:  tender.peserta_evaluasi,
        },
      });
    }

    // Belum ada / sudah kadaluarsa → jalankan Puppeteer
    // Ekstrak slug dari url_lpse
    let slug = "";
    try {
      slug = new URL(url_lpse).pathname.replace(/^\//, "").split("/")[0];
    } catch {
      // Fallback: coba ambil dari DB
      slug = tender?.url_lpse
        ? new URL(tender.url_lpse).pathname.replace(/^\//, "").split("/")[0]
        : "";
    }

    if (!slug) {
      return NextResponse.json({ error: "Tidak dapat menentukan slug LPSE" }, { status: 400 });
    }

    const scrapedData = await scrapeInfoTender(slug, lelangId);
    const now = new Date();

    const updatePayload: any = {
      ...scrapedData,
      info_synced_at: now,
    };

    if (scrapedData.status === "selesai") {
      updatePayload.finished_at = now;
      if (!tender?.archived_at) {
        updatePayload.archived_at = now;
        updatePayload.archived_reason = "Tender telah selesai";
      }
      // Jika data pemenang berhasil diambil → update status ke "menang"
      if (scrapedData.pemenang_nama && String(scrapedData.pemenang_nama).trim().length > 2) {
        updatePayload.status = "menang";
      }
    }

    // Simpan ke MongoDB
    await TenderModel.updateOne(
      { lelangId },
      { $set: updatePayload },
      { upsert: true }
    );

    return NextResponse.json({
      source: "lpse",
      data: {
        ...scrapedData,
        info_synced_at: now,
      },
    });
  } catch (err: any) {
    console.error("[sync-info] Error:", err);
    return NextResponse.json({ error: err.message || "Gagal mengambil data" }, { status: 500 });
  }
}
