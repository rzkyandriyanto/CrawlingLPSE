const https = require('https');

const url = 'https://lpse.bekasikota.go.id/eproc4/dt/lelang?draw=1&start=0&length=10';

const agent = new https.Agent({
  rejectUnauthorized: false,
  secureOptions: require('crypto').constants.SSL_OP_LEGACY_SERVER_CONNECT
});

https.get(url, { agent }, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log('Success, found', json.data?.length, 'items');
      if (json.data && json.data.length > 0) {
         console.log('Sample item:', JSON.stringify(json.data[0]).substring(0, 500) + '...');
      }
    } catch(e) {
      console.log('Error parsing JSON:', e.message);
      console.log('Response body:', data.substring(0, 500) + '...');
    }
  });

}).on('error', (err) => {
  console.log('Request Error: ', err.message);
});
