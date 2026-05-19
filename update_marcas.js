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
  const updates = [
    { nombre: 'Activa', logo: '/marcas/activa.png' },
    { nombre: 'Bolka', logo: '/marcas/bolka.png' },
    { nombre: 'Buss', logo: '/marcas/buss.png' },
    { nombre: 'Conamoda', logo: '/marcas/conamoda.png' },
    { nombre: 'Fast Run', logo: '/marcas/fast-run.png' },
    { nombre: 'Gasper', logo: '/marcas/gasper.png' },
    { nombre: 'Golero', logo: '/marcas/golero.png' },
    { nombre: 'Graser', logo: '/marcas/grasep.png' },
    { nombre: 'Grasep', logo: '/marcas/grasep.png' },
  ];
  
  for (const u of updates) {
    console.log('Updating', u.nombre);
    const { error } = await supabase.from('marcas').update({ logo_url: u.logo }).ilike('nombre', u.nombre);
    if (error) console.error('Error with', u.nombre, error);
  }
  console.log('Done');
}
run();
