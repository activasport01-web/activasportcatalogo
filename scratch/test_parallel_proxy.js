const https = require('https');

function makeProxyRequest(targetPath) {
  return new Promise((resolve) => {
    const targetUrl = `https://kaloxowczuyyzzuhduep.supabase.co${targetPath}`;
    const url = `https://activasport.vercel.app/api/proxy?target=${encodeURIComponent(targetUrl)}`;
    
    const start = Date.now();
    
    const req = https.get(url, {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbG94b3djenV5eXp6dWhkdWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMzI0MTgsImV4cCI6MjA4NDkwODQxOH0.5yt3xejqYEpnNY1rEa-lB_BC_ZoGOoiktX1mxOjksNI'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          path: targetPath,
          status: res.statusCode,
          time: Date.now() - start,
          dataLength: data.length,
          error: res.statusCode >= 400 ? data : null
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        path: targetPath,
        status: 0,
        time: Date.now() - start,
        dataLength: 0,
        error: err.message
      });
    });
    
    req.setTimeout(45000, () => {
      req.destroy();
      resolve({
        path: targetPath,
        status: 'TIMEOUT',
        time: Date.now() - start,
        dataLength: 0,
        error: 'Request timed out'
      });
    });
  });
}

async function run() {
  const paths = [
    '/rest/v1/zapatos?select=*,cat_obj:categorias(nombre),marca_obj:marcas(nombre),gen_obj:generos(nombre)&order=fecha_creacion.desc',
    '/rest/v1/marcas?select=*&active=eq.true&order=nombre',
    '/rest/v1/categorias?select=*&activa=eq.true&order=orden',
    '/rest/v1/subcategorias?select=*&activa=eq.true&order=orden',
    '/rest/v1/generos?select=*&activa=eq.true&order=orden',
    '/rest/v1/grupos_tallas?select=*&activa=eq.true&order=orden'
  ];
  
  console.log('Sending 6 requests in PARALLEL...');
  const start = Date.now();
  const results = await Promise.all(paths.map(path => makeProxyRequest(path)));
  const totalTime = Date.now() - start;
  
  results.forEach(result => {
    console.log(`Path: ${result.path.split('?')[0]} | Status: ${result.status} | Time: ${result.time}ms | Length: ${result.dataLength} bytes`);
    if (result.error) {
      console.error(`  Error:`, result.error.substring(0, 150));
    }
  });
  console.log(`Total time for all parallel requests: ${totalTime}ms`);
}

run();
