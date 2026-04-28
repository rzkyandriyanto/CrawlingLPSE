const cheerio = require('cheerio');

async function testSiteSearch() {
  const url = 'https://html.duckduckgo.com/html/?q=site:lpse.bekasikota.go.id+pengadaan';
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  let results = [];
  $(".result").each((_, el) => {
    const title = $(el).find(".result__title").text().trim();
    const snippet = $(el).find(".result__snippet").text().trim();
    results.push({ title, snippet });
  });
  console.log(results.slice(0, 3));
}
testSiteSearch();
