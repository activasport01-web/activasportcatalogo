const http = require('http');

function makeRequest(method, hasBody) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/proxy?target=https://kaloxowczuyyzzuhduep.supabase.co/rest/v1/zapatos?select=id&limit=1',
      method: method,
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbG94b3djenV5eXp6dWhkdWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMzI0MTgsImV4cCI6MjA4NDkwODQxOH0.5yt3xejqYEpnNY1rEa-lB_BC_ZoGOoiktX1mxOjksNI'
      }
    };

    if (hasBody) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (hasBody) {
      req.write(JSON.stringify({}));
    }
    req.end();
  });
}

async function run() {
  console.log('Testing GET...');
  try {
    const res = await makeRequest('GET', false);
    console.log('GET response:', res.status);
  } catch (e) {
    console.error('GET failed:', e.message);
  }

  console.log('Testing POST with body...');
  try {
    const res = await makeRequest('POST', true);
    console.log('POST with body response:', res.status);
  } catch (e) {
    console.error('POST with body failed:', e.message);
  }

  console.log('Testing POST without body...');
  try {
    const res = await makeRequest('POST', false);
    console.log('POST without body response:', res.status);
  } catch (e) {
    console.error('POST without body failed:', e.message);
  }

  console.log('Testing OPTIONS...');
  try {
    const res = await makeRequest('OPTIONS', false);
    console.log('OPTIONS response:', res.status);
  } catch (e) {
    console.error('OPTIONS failed:', e.message);
  }
}

run();
