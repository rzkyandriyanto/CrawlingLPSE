const https = require("https");

const LPSE_LIST = [
  // KEMENTERIAN & LEMBAGA (28)
  { nama: "LPSE Kementerian Keuangan", url: "https://spse.inaproc.id/kemenkeu/eproc4" },
  { nama: "LPSE Kementerian PUPR", url: "https://spse.inaproc.id/pu/eproc4" },
  { nama: "LPSE Kementerian Kesehatan", url: "https://spse.inaproc.id/depkes/eproc4" },
  { nama: "LPSE Kementerian Pendidikan", url: "https://spse.inaproc.id/kemdikbud/eproc4" },
  { nama: "LPSE Kementerian Pertanian", url: "https://spse.inaproc.id/deptan/eproc4" },
  { nama: "LPSE Kementerian Dalam Negeri", url: "https://spse.inaproc.id/depdagri/eproc4" },
  { nama: "LPSE Kementerian Lingkungan Hidup", url: "https://spse.inaproc.id/menlhk/eproc4" },
  { nama: "LPSE LKPP", url: "https://spse.inaproc.id/lkpp/eproc4" },
  { nama: "LPSE BPKP", url: "https://spse.inaproc.id/bpkp/eproc4" },
  { nama: "LPSE BPS", url: "https://spse.inaproc.id/bps/eproc4" },
  { nama: "LPSE KPK", url: "https://spse.inaproc.id/kpk/eproc4" },
  { nama: "LPSE Mahkamah Agung", url: "https://spse.inaproc.id/mahkamahagung/eproc4" },
  { nama: "LPSE Kejaksaan Agung", url: "https://spse.inaproc.id/kejaksaan/eproc4" },
  { nama: "LPSE Polri", url: "https://spse.inaproc.id/polri/eproc4" },
  { nama: "LPSE TNI AD", url: "https://spse.inaproc.id/tniad/eproc4" },
  { nama: "LPSE Kementerian Kominfo", url: "https://spse.inaproc.id/kominfo/eproc4" },
  { nama: "LPSE Kementerian ESDM", url: "https://spse.inaproc.id/esdm/eproc4" },
  { nama: "LPSE Kementerian Perindustrian", url: "https://spse.inaproc.id/kemenperin/eproc4" },
  { nama: "LPSE Kementerian Perdagangan", url: "https://spse.inaproc.id/kemendag/eproc4" },
  { nama: "LPSE Kementerian Tenaga Kerja", url: "https://spse.inaproc.id/kemenaker/eproc4" },
  { nama: "LPSE Kementerian Perhubungan", url: "https://spse.inaproc.id/dephub/eproc4" },
  { nama: "LPSE Kementerian Kelautan", url: "https://spse.inaproc.id/kkp/eproc4" },
  { nama: "LPSE Kementerian Pariwisata", url: "https://spse.inaproc.id/kemenpar/eproc4" },
  { nama: "LPSE Kementerian Agama", url: "https://spse.inaproc.id/depag/eproc4" },
  { nama: "LPSE Kementerian Sosial", url: "https://spse.inaproc.id/depsos/eproc4" },
  { nama: "LPSE Kementerian PMK", url: "https://spse.inaproc.id/pmk/eproc4" },
  { nama: "LPSE BAPPENAS", url: "https://spse.inaproc.id/bappenas/eproc4" },
  { nama: "LPSE BRIN", url: "https://spse.inaproc.id/brin/eproc4" },
  // DKI JAKARTA (6)
  { nama: "LPSE Provinsi DKI Jakarta", url: "https://spse.inaproc.id/dkijakarta/eproc4" },
  { nama: "LPSE Kota Jakarta Pusat", url: "https://spse.inaproc.id/jakpus/eproc4" },
  { nama: "LPSE Kota Jakarta Selatan", url: "https://spse.inaproc.id/jaksel/eproc4" },
  { nama: "LPSE Kota Jakarta Timur", url: "https://spse.inaproc.id/jaktim/eproc4" },
  { nama: "LPSE Kota Jakarta Barat", url: "https://spse.inaproc.id/jakbar/eproc4" },
  { nama: "LPSE Kota Jakarta Utara", url: "https://spse.inaproc.id/jakut/eproc4" },
  // JAWA BARAT (23)
  { nama: "LPSE Provinsi Jawa Barat", url: "https://spse.inaproc.id/jabarprov/eproc4" },
  { nama: "LPSE Kota Bandung", url: "https://spse.inaproc.id/bandung/eproc4" },
  { nama: "LPSE Kota Bogor", url: "https://spse.inaproc.id/bogorkota/eproc4" },
  { nama: "LPSE Kota Bekasi", url: "https://spse.inaproc.id/bekasikota/eproc4" },
  { nama: "LPSE Kota Depok", url: "https://spse.inaproc.id/depokkota/eproc4" },
  { nama: "LPSE Kota Cimahi", url: "https://spse.inaproc.id/cimahikota/eproc4" },
  { nama: "LPSE Kota Sukabumi", url: "https://spse.inaproc.id/sukabumikota/eproc4" },
  { nama: "LPSE Kota Cirebon", url: "https://spse.inaproc.id/cirebonkota/eproc4" },
  { nama: "LPSE Kota Tasikmalaya", url: "https://spse.inaproc.id/tasikmalayakota/eproc4" },
  { nama: "LPSE Kota Banjar", url: "https://spse.inaproc.id/banjar/eproc4" },
  { nama: "LPSE Kabupaten Bogor", url: "https://spse.inaproc.id/bogorkab/eproc4" },
  { nama: "LPSE Kabupaten Bekasi", url: "https://spse.inaproc.id/bekasikab/eproc4" },
  { nama: "LPSE Kabupaten Karawang", url: "https://spse.inaproc.id/karawang/eproc4" },
  { nama: "LPSE Kabupaten Purwakarta", url: "https://spse.inaproc.id/purwakarta/eproc4" },
  { nama: "LPSE Kabupaten Subang", url: "https://spse.inaproc.id/subang/eproc4" },
  { nama: "LPSE Kabupaten Indramayu", url: "https://spse.inaproc.id/indramayu/eproc4" },
  { nama: "LPSE Kabupaten Cirebon", url: "https://spse.inaproc.id/cirebonkab/eproc4" },
  { nama: "LPSE Kabupaten Majalengka", url: "https://spse.inaproc.id/majalengka/eproc4" },
  { nama: "LPSE Kabupaten Kuningan", url: "https://spse.inaproc.id/kuningan/eproc4" },
  { nama: "LPSE Kabupaten Sumedang", url: "https://spse.inaproc.id/sumedang/eproc4" },
  { nama: "LPSE Kabupaten Garut", url: "https://spse.inaproc.id/garut/eproc4" },
  { nama: "LPSE Kabupaten Bandung", url: "https://spse.inaproc.id/bandungkab/eproc4" },
  { nama: "LPSE Kabupaten Bandung Barat", url: "https://spse.inaproc.id/bandungbarat/eproc4" },
  { nama: "LPSE Kabupaten Sukabumi", url: "https://spse.inaproc.id/sukabumikab/eproc4" },
  { nama: "LPSE Kabupaten Cianjur", url: "https://spse.inaproc.id/cianjur/eproc4" },
  { nama: "LPSE Kabupaten Tasikmalaya", url: "https://spse.inaproc.id/tasikmalayakab/eproc4" },
  { nama: "LPSE Kabupaten Ciamis", url: "https://spse.inaproc.id/ciamis/eproc4" },
  { nama: "LPSE Kabupaten Pangandaran", url: "https://spse.inaproc.id/pangandaran/eproc4" },
  // BANTEN (9)
  { nama: "LPSE Provinsi Banten", url: "https://spse.inaproc.id/banten/eproc4" },
  { nama: "LPSE Kota Tangerang", url: "https://spse.inaproc.id/tangerangkota/eproc4" },
  { nama: "LPSE Kota Tangerang Selatan", url: "https://spse.inaproc.id/tangsel/eproc4" },
  { nama: "LPSE Kota Serang", url: "https://spse.inaproc.id/serangkota/eproc4" },
  { nama: "LPSE Kota Cilegon", url: "https://spse.inaproc.id/cilegon/eproc4" },
  { nama: "LPSE Kabupaten Tangerang", url: "https://spse.inaproc.id/tangerangkab/eproc4" },
  { nama: "LPSE Kabupaten Serang", url: "https://spse.inaproc.id/serangkab/eproc4" },
  { nama: "LPSE Kabupaten Lebak", url: "https://spse.inaproc.id/lebak/eproc4" },
  { nama: "LPSE Kabupaten Pandeglang", url: "https://spse.inaproc.id/pandeglang/eproc4" },
  // JAWA TENGAH (35)
  { nama: "LPSE Provinsi Jawa Tengah", url: "https://spse.inaproc.id/jatengprov/eproc4" },
  { nama: "LPSE Kota Semarang", url: "https://spse.inaproc.id/semarangkota/eproc4" },
  { nama: "LPSE Kota Solo", url: "https://spse.inaproc.id/surakarta/eproc4" },
  { nama: "LPSE Kota Magelang", url: "https://spse.inaproc.id/magelangkota/eproc4" },
  { nama: "LPSE Kota Salatiga", url: "https://spse.inaproc.id/salatiga/eproc4" },
  { nama: "LPSE Kota Pekalongan", url: "https://spse.inaproc.id/pekalongan/eproc4" },
  { nama: "LPSE Kota Tegal", url: "https://spse.inaproc.id/tegalkota/eproc4" },
  { nama: "LPSE Kabupaten Semarang", url: "https://spse.inaproc.id/semarangkab/eproc4" },
  { nama: "LPSE Kabupaten Demak", url: "https://spse.inaproc.id/demak/eproc4" },
  { nama: "LPSE Kabupaten Kendal", url: "https://spse.inaproc.id/kendal/eproc4" },
  { nama: "LPSE Kabupaten Batang", url: "https://spse.inaproc.id/batang/eproc4" },
  { nama: "LPSE Kabupaten Pemalang", url: "https://spse.inaproc.id/pemalang/eproc4" },
  { nama: "LPSE Kabupaten Tegal", url: "https://spse.inaproc.id/tegalkab/eproc4" },
  { nama: "LPSE Kabupaten Brebes", url: "https://spse.inaproc.id/brebes/eproc4" },
  { nama: "LPSE Kabupaten Banyumas", url: "https://spse.inaproc.id/banyumas/eproc4" },
  { nama: "LPSE Kabupaten Cilacap", url: "https://spse.inaproc.id/cilacap/eproc4" },
  { nama: "LPSE Kabupaten Kebumen", url: "https://spse.inaproc.id/kebumen/eproc4" },
  { nama: "LPSE Kabupaten Purworejo", url: "https://spse.inaproc.id/purworejo/eproc4" },
  { nama: "LPSE Kabupaten Magelang", url: "https://spse.inaproc.id/magelangkab/eproc4" },
  { nama: "LPSE Kabupaten Wonosobo", url: "https://spse.inaproc.id/wonosobo/eproc4" },
  { nama: "LPSE Kabupaten Temanggung", url: "https://spse.inaproc.id/temanggung/eproc4" },
  { nama: "LPSE Kabupaten Boyolali", url: "https://spse.inaproc.id/boyolali/eproc4" },
  { nama: "LPSE Kabupaten Klaten", url: "https://spse.inaproc.id/klaten/eproc4" },
  { nama: "LPSE Kabupaten Sukoharjo", url: "https://spse.inaproc.id/sukoharjo/eproc4" },
  { nama: "LPSE Kabupaten Wonogiri", url: "https://spse.inaproc.id/wonogiri/eproc4" },
  { nama: "LPSE Kabupaten Karanganyar", url: "https://spse.inaproc.id/karanganyar/eproc4" },
  { nama: "LPSE Kabupaten Sragen", url: "https://spse.inaproc.id/sragen/eproc4" },
  { nama: "LPSE Kabupaten Grobogan", url: "https://spse.inaproc.id/grobogan/eproc4" },
  { nama: "LPSE Kabupaten Blora", url: "https://spse.inaproc.id/blora/eproc4" },
  { nama: "LPSE Kabupaten Rembang", url: "https://spse.inaproc.id/rembang/eproc4" },
  { nama: "LPSE Kabupaten Pati", url: "https://spse.inaproc.id/pati/eproc4" },
  { nama: "LPSE Kabupaten Kudus", url: "https://spse.inaproc.id/kudus/eproc4" },
  { nama: "LPSE Kabupaten Jepara", url: "https://spse.inaproc.id/jepara/eproc4" },
  { nama: "LPSE Kabupaten Purbalingga", url: "https://spse.inaproc.id/purbalingga/eproc4" },
  { nama: "LPSE Kabupaten Banjarnegara", url: "https://spse.inaproc.id/banjarnegara/eproc4" },
  // DIY (6)
  { nama: "LPSE Provinsi DIY", url: "https://spse.inaproc.id/diy/eproc4" },
  { nama: "LPSE Kota Yogyakarta", url: "https://spse.inaproc.id/yogyakarta/eproc4" },
  { nama: "LPSE Kabupaten Sleman", url: "https://spse.inaproc.id/sleman/eproc4" },
  { nama: "LPSE Kabupaten Bantul", url: "https://spse.inaproc.id/bantul/eproc4" },
  { nama: "LPSE Kabupaten Kulonprogo", url: "https://spse.inaproc.id/kulonprogo/eproc4" },
  { nama: "LPSE Kabupaten Gunungkidul", url: "https://spse.inaproc.id/gunungkidul/eproc4" },
  // IKN
  { nama: "LPSE Otorita IKN", url: "https://spse.inaproc.id/ikn/eproc4" },
];

// ── Fungsi cek satu URL ──────────────────────────────────────────────────────
function checkUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ status: "TIMEOUT", code: null }), timeout);
    try {
      const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        clearTimeout(timer);
        resolve({ status: res.statusCode < 400 ? "OK" : "ERROR", code: res.statusCode });
        res.resume();
      });
      req.on("error", (e) => { clearTimeout(timer); resolve({ status: "ERROR", code: e.code }); });
    } catch (e) {
      clearTimeout(timer);
      resolve({ status: "ERROR", code: e.message });
    }
  });
}

// ── Main: cek semua URL dengan concurrency 10 ────────────────────────────────
async function main() {
  console.log(`\n${"═".repeat(65)}`);
  console.log(`🔍  CEK ${LPSE_LIST.length} URL LPSE`);
  console.log(`${"═".repeat(65)}\n`);

  const results = { ok: [], error: [], timeout: [] };
  const CONCURRENCY = 10;

  for (let i = 0; i < LPSE_LIST.length; i += CONCURRENCY) {
    const batch = LPSE_LIST.slice(i, i + CONCURRENCY);
    const checks = await Promise.all(
      batch.map(async (lpse) => {
        let result = await checkUrl(lpse.url);
        // Jika 404 dan URL mengandung /eproc4, coba versi tanpa /eproc4
        if (result.status === "ERROR" && result.code === 404 && lpse.url.endsWith("/eproc4")) {
          const fallbackUrl = lpse.url.replace(/\/eproc4$/, "");
          const fallbackResult = await checkUrl(fallbackUrl);
          if (fallbackResult.status === "OK") {
            result = fallbackResult;
            lpse.url = fallbackUrl; // Perbarui URL dengan yang benar
            lpse.nama = lpse.nama + " (Fixed)";
          }
        }
        return { ...lpse, ...result };
      })
    );
    for (const r of checks) {
      const icon = r.status === "OK" ? "✅" : r.status === "TIMEOUT" ? "⏰" : "❌";
      console.log(`${icon} [${String(r.code).padEnd(7)}] ${r.nama} -> ${r.url}`);
      if (r.status === "OK") results.ok.push(r);
      else if (r.status === "TIMEOUT") results.timeout.push(r);
      else results.error.push(r);
    }
  }

  console.log(`\n${"═".repeat(65)}`);
  console.log(`📊  HASIL AKHIR`);
  console.log(`${"═".repeat(65)}`);
  console.log(`✅  Aktif   : ${results.ok.length} LPSE`);
  console.log(`❌  Error   : ${results.error.length} LPSE`);
  console.log(`⏰  Timeout : ${results.timeout.length} LPSE`);
  console.log(`📌  Total   : ${LPSE_LIST.length} LPSE\n`);

  if (results.error.length > 0) {
    console.log("❌  URL yang ERROR:");
    results.error.forEach(r => console.log(`   - ${r.nama} (${r.code})`));
  }
  if (results.timeout.length > 0) {
    console.log("\n⏰  URL yang TIMEOUT:");
    results.timeout.forEach(r => console.log(`   - ${r.nama}`));
  }

  console.log("\n✅  URL yang AKTIF:");
  results.ok.forEach(r => console.log(`   - ${r.nama}`));
}

main().catch(console.error);
