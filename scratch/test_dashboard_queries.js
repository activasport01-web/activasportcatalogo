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
  console.log('Testing loadStats queries...');
  try {
    const q1 = await supabase.from('zapatos').select('*', { count: 'exact', head: true });
    console.log('zapatos count:', q1.count, 'error:', q1.error);
    
    const q2 = await supabase.from('categorias').select('*', { count: 'exact', head: true }).eq('activa', true);
    console.log('categorias count:', q2.count, 'error:', q2.error);
  } catch (e) {
    console.error('Stats query failed:', e.message);
  }

  console.log('\nTesting loadCharts query (movimientos_kardex)...');
  try {
    const hace7Dias = new Date(); hace7Dias.setDate(hace7Dias.getDate() - 7);
    const { data, error } = await supabase.from('movimientos_kardex')
      .select('tipo, cantidad, precio_total, fecha')
      .gte('fecha', hace7Dias.toISOString())
      .order('fecha', { ascending: true });
    console.log('movimientos_kardex rows:', data ? data.length : null, 'error:', error);
  } catch (e) {
    console.error('Kardex query failed:', e.message);
  }

  console.log('\nTesting loadCapital query...');
  try {
    const { data, error } = await supabase
      .from('zapatos')
      .select('nombre, cat_obj:categorias(nombre), stock_bultos, precio_costo')
      .gt('stock_bultos', 0);
    console.log('zapatos for capital rows:', data ? data.length : null, 'error:', error);
  } catch (e) {
    console.error('Capital query failed:', e.message);
  }
}

run();
