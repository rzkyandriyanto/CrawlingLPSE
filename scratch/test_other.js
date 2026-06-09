const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve(`${url} -> HTTP ${res.statusCode} (Location: ${res.headers.location})`);
    }).on('error', (e) => {
      resolve(`${url} -> Error: ${e.message}`);
    });
  });
}

async function run() {
  console.log(await checkUrl('https://spse.inaproc.id/kemenkeu/lelang/10002721000/pengumumanlelang'));
  console.log(await checkUrl('https://spse.inaproc.id/magelangkota/lelang/10005322000/pengumumanlelang'));
}
run();
