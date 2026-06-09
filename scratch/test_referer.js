const https = require('https');

function checkUrl(url, headers) {
  return new Promise((resolve) => {
    https.get(url, { headers }, (res) => {
      resolve(`${url} -> HTTP ${res.statusCode} (Location: ${res.headers.location})`);
    }).on('error', (e) => {
      resolve(`${url} -> Error: ${e.message}`);
    });
  });
}

async function run() {
  const url = 'https://spse.inaproc.id/kejaksaan/lelang/10136054000/pengumumanlelang';
  
  console.log("No Referer:");
  console.log(await checkUrl(url, { 'User-Agent': 'Mozilla/5.0' }));
  
  console.log("With Referer (spse):");
  console.log(await checkUrl(url, { 
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://spse.inaproc.id/kejaksaan/lelang'
  }));

  console.log("With Referer (localhost):");
  console.log(await checkUrl(url, { 
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'http://localhost:3000'
  }));
}

run();
