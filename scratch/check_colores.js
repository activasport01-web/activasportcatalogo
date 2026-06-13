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
    const { data: shoes, error } = await supabase
      .from('zapatos')
      .select('id, nombre, colores');
      
    if (error) {
      console.error('Query failed:', error);
      return;
    }
    
    console.log('Inspecting colores field for all shoes:');
    let badRecordsCount = 0;
    for (const shoe of shoes) {
      const col = shoe.colores;
      const colType = typeof col;
      const isArr = Array.isArray(col);
      console.log(`ID ${shoe.id} (${shoe.nombre}): Type = ${colType}, IsArray = ${isArr}, Value =`, JSON.stringify(col));
      
      if (col !== null && !isArr) {
        badRecordsCount++;
        console.error(`!!! BAD RECORD FOUND: ID ${shoe.id}`);
      }
    }
    console.log(`Inspection complete. Bad records found: ${badRecordsCount}`);
  } catch (e) {
    console.error('Crash:', e.message);
  }
}
run();
