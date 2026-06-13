const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/admin/productos',
  method: 'GET',
  headers: {
    'Cookie': 'admin_session=1'
  }
};

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (data.includes('Panel Administrativo')) {
      console.log('Returned Login page');
    } else if (data.includes('Productos') || data.includes('productos')) {
      console.log('Returned Products page! Length:', data.length);
      // Look for any server-side rendered error or title
      const titleMatch = data.match(/<title>([^<]+)<\/title>/);
      if (titleMatch) console.log('Title:', titleMatch[1]);
    } else {
      console.log('Returned something else. Length:', data.length);
    }
  });
});

req.on('error', (err) => {
  console.error(err);
});

req.end();
