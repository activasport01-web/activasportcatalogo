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
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY; // Service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching all users in usuarios table...');
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select(`
        id, 
        nombre_completo, 
        rol_id, 
        activo,
        roles (
          nombre
        )
      `);
      
    if (error) {
      console.error('Failed to fetch usuarios:', error);
    } else {
      console.log('Usuarios count:', data.length);
      console.log('Usuarios data:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error('Crash:', e.message);
  }
}

run();
