const http = require('http');

const payload = {
  nombre: "Buss Running N",
  codigo: "137",
  caja: "caja",
  descripcion: "exp",
  precio: 0,
  colores: [
    {
      color: "#FFFFFF",
      imagen: "https://kaloxowczuyyzzuhduep.supabase.co/storage/v1/object/public/imagenes-zapatos/variant_178138520894_whatsapp_image_2026-06-12_at_16.00.33_1.jpeg",
      nombre: "Blanco",
      imagenes: []
    }
  ],
  disponible: true,
  etiquetas: ["nuevo"],
  genero_id: "cbf90d5d-4861-4b9f-804c-5bd2e856cf90",
  grupo_talla: "Adulto",
  imagen_hover: null,
  marca_id: "92a23983-301e-48b8-a028-91d0862f118f",
  origen: "Buss",
  precio_costo: 0,
  stock_bultos: 0,
  subcategoria_id: "b0d32673-e6f4-4eb0-af53-a668dd21b428",
  tallas: [],
  url_imagen: "https://kaloxowczuyyzzuhduep.supabase.co/storage/v1/object/public/imagenes-zapatos/variant_178138520894_whatsapp_image_2026-06-12_at_16.00.33_1.jpeg",
  variantes_tallas: []
};

function testPost() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    
    // We send this to our local dev server proxy
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/proxy?target=' + encodeURIComponent('https://kaloxowczuyyzzuhduep.supabase.co/rest/v1/zapatos'),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthbG94b3djenV5eXp6dWhkdWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMzI0MTgsImV4cCI6MjA4NDkwODQxOH0.5yt3xejqYEpnNY1rEa-lB_BC_ZoGOoiktX1mxOjksNI',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`[Test] Sending POST with size ${postData.length} bytes...`);
    const start = Date.now();
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          time: Date.now() - start,
          data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    const res = await testPost();
    console.log(`[Result] Status: ${res.status} | Time: ${res.time}ms`);
    console.log(`[Response]:`, res.data);
  } catch (e) {
    console.error(`[Error]:`, e.message);
  }
}
run();
