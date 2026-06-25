const cheerio = require('cheerio');
fetch('https://spse.inaproc.id/bogorkab/lelang/10132125000/jadwal')
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    const trs = $('table.table tbody tr, table tbody tr').toArray();
    const jadwal = trs.map(tr => {
      const tds = $(tr).find('td,th').toArray().map(td => $(td).text().trim());
      if(tds.length >= 4 && tds[1] && !tds[1].toLowerCase().includes('tahap')) {
        return { tahap: tds[1], mulai: tds[2], sampai: tds[3], perubahan: tds[4] || 'Tidak Ada'};
      }
      return null;
    }).filter(Boolean);
    console.log(jadwal);
  });
