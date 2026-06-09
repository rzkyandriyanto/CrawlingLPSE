const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
  
  // Try to visit an active tender's peserta page
  const url = "https://spse.inaproc.id/eproc4/lelang/71120019/peserta";
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await new Promise(r => setTimeout(r, 2000));
  
  const data = await page.evaluate(() => {
    const table = document.querySelector("table.table");
    if (!table) return null;
    const ths = Array.from(table.querySelectorAll("th")).map(th => th.textContent.trim());
    const rows = Array.from(table.querySelectorAll("tbody tr")).map(tr => {
      return Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim());
    });
    return { headers: ths, rows: rows.slice(0, 3) };
  });

  console.log(data);
  await browser.close();
})();
