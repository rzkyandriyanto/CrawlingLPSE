const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(`${url} -> HTTP ${res.statusCode}`);
    }).on('error', (e) => {
      resolve(`${url} -> Error: ${e.message}`);
    });
  });
}

async function run() {
  const url1 = 'https://spse.inaproc.id/kejaksaan/lelang/10136054000/pengumumanlelang';
  const url2 = 'https://spse.inaproc.id/kejaksaan/eproc4/lelang/10136054000/pengumumanlelang';
  
  console.log(await checkUrl(url1));
  console.log(await checkUrl(url2));
}

run();
