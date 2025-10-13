// Quick diagnostic to see what environment variables GitHub Actions has

console.log('Environment Check:');
console.log('==================');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✓ Set (length: ' + process.env.VITE_SUPABASE_ANON_KEY?.length + ')' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE:', process.env.SUPABASE_SERVICE_ROLE ? '✓ Set (length: ' + process.env.SUPABASE_SERVICE_ROLE?.length + ')' : '❌ Missing');

if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE) {
  console.log('\n❌ CRITICAL: Missing required environment variables!');
  console.log('\nYou need to set these GitHub Secrets:');
  console.log('1. SUPABASE_URL = https://qhyrfjletazbsjsfosdl.supabase.co');
  console.log('2. SUPABASE_ANON_KEY = (your anon key)');
  console.log('3. SUPABASE_SERVICE_ROLE = (your service role key)');
  process.exit(1);
}

console.log('\n✓ All environment variables present');
