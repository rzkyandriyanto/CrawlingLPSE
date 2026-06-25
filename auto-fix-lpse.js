const fs = require("fs");
const https = require("https");
const path = require("path");

const FILE_PATH = path.join(__dirname, "scripts", "lpse-scraper", "lpse-list.js");
const { LPSE_LIST } = require("./scripts/lpse-scraper/lpse-list.js");

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

async function main() {
  console.log(`\n${"═".repeat(65)}`);
  console.log(`🔍  AUTO-FIX CEK ${LPSE_LIST.length} URL LPSE`);
  console.log(`${"═".repeat(65)}\n`);

  let fileContent = fs.readFileSync(FILE_PATH, "utf8");
  const CONCURRENCY = 15;
  let fixedCount = 0;
  let okCount = 0;
  let errorCount = 0;

  for (let i = 0; i < LPSE_LIST.length; i += CONCURRENCY) {
    const batch = LPSE_LIST.slice(i, i + CONCURRENCY);
    const checks = await Promise.all(
      batch.map(async (lpse) => {
        let result = await checkUrl(lpse.url);
        let fixed = false;
        
        if (result.status === "ERROR" && result.code === 404 && lpse.url.endsWith("/eproc4")) {
          const fallbackUrl = lpse.url.replace(/\/eproc4$/, "");
          const fallbackResult = await checkUrl(fallbackUrl);
          if (fallbackResult.status === "OK") {
            result = fallbackResult;
            fileContent = fileContent.replace(`"${lpse.url}"`, `"${fallbackUrl}"`);
            fixed = true;
          }
        }
        return { ...lpse, ...result, fixed };
      })
    );

    for (const r of checks) {
      if (r.fixed) {
        console.log(`🔧 [FIXED] ${r.nama} -> removed /eproc4`);
        fixedCount++;
      } else if (r.status === "OK") {
        console.log(`✅ [OK   ] ${r.nama}`);
        okCount++;
      } else {
        console.log(`❌ [ERROR] ${r.nama} (${r.code}) -> ${r.url}`);
        errorCount++;
      }
    }
  }

  // Save the updated content
  if (fixedCount > 0) {
    fs.writeFileSync(FILE_PATH, fileContent, "utf8");
    console.log(`\n💾 Disimpan! ${fixedCount} URL berhasil diperbaiki di lpse-list.js`);
  } else {
    console.log(`\n👍 Tidak ada URL yang perlu diperbaiki (atau yang bisa di-fix).`);
  }

  console.log(`\n📊 RINGKASAN:`);
  console.log(`✅ Aktif/OK: ${okCount}`);
  console.log(`🔧 Diperbaiki (dari 404 jadi 200): ${fixedCount}`);
  console.log(`❌ Gagal/Error: ${errorCount}`);
  console.log(`Total: ${LPSE_LIST.length}\n`);
}

main().catch(console.error);
