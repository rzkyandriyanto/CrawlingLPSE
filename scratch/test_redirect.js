const https = require('https');

function checkRedirect(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve(`${url} -> HTTP ${res.statusCode} (Location: ${res.headers.location})`);
    }).on('error', (e) => {
      resolve(`${url} -> Error: ${e.message}`);
    });
  });
}

async function run() {
  console.log(await checkRedirect('https://spse.inaproc.id/kejaksaan'));
  console.log(await checkRedirect('https://spse.inaproc.id/kejaksaan/'));
  console.log(await checkRedirect('https://lpse.kejaksaan.go.id/eproc4'));
}
run();
