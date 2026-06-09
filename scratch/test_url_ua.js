const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } }, (res) => {
      resolve(`${url} -> HTTP ${res.statusCode} (Location: ${res.headers.location})`);
    }).on('error', (e) => {
      resolve(`${url} -> Error: ${e.message}`);
    });
  });
}

async function run() {
  const urls = [
    'https://spse.inaproc.id/kejaksaan/lelang/10136054000/pengumumanlelang',
    'https://spse.inaproc.id/kejaksaan/eproc4/lelang/10136054000/pengumumanlelang',
    'https://lpse.kejaksaan.go.id/eproc4/lelang/10136054000/pengumumanlelang',
    'https://lpse.kejaksaan.go.id/eproc4/evaluasi/10136054000/hasil'
  ];
  
  for (const u of urls) {
    console.log(await checkUrl(u));
  }
}

run();
