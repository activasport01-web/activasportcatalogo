const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase
      .from('zapatos')
      .select('*, cat_obj:categorias(nombre), marca_obj:marcas(nombre), gen_obj:generos(nombre)')
      .order('fecha_creacion', { ascending: false });
      
    if (error) {
      console.error('loadProductos query failed:', error);
    } else {
      console.log('loadProductos query succeeded! Total items:', data.length);
      console.log('Sample item:', data[0]);
    }
  } catch (e) {
    console.error('Crash running query:', e.message);
  }
}
run();
