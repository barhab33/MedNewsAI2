#!/usr/bin/env node

console.log('🔒 DATABASE SECURITY FIX INSTRUCTIONS\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('STEP 1: Get your Service Role Key');
console.log('─────────────────────────────────────');
console.log('1. Go to: https://supabase.com/dashboard/project/qhyrfjletazbsjsfosdl/settings/api');
console.log('2. Scroll to "Project API keys"');
console.log('3. Copy the "service_role" key (NOT the anon key)\n');

console.log('STEP 2: Apply the Security Fix');
console.log('─────────────────────────────────────');
console.log('1. Go to: https://supabase.com/dashboard/project/qhyrfjletazbsjsfosdl/sql/new');
console.log('2. Paste this SQL and click "RUN":\n');

const sql = `-- Fix Security Policies
DROP POLICY IF EXISTS "Anyone can view medical news" ON medical_news;
DROP POLICY IF EXISTS "Service role can insert news" ON medical_news;
DROP POLICY IF EXISTS "Service role can update news" ON medical_news;

-- Public read access (news site - this is intentional)
CREATE POLICY "Public read access to news"
  ON medical_news
  FOR SELECT
  TO public
  USING (true);

-- Service role only for modifications
CREATE POLICY "Service role can insert news"
  ON medical_news
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update news"
  ON medical_news
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete news"
  ON medical_news
  FOR DELETE
  TO service_role
  USING (true);`;

console.log(sql);
console.log('\n3. Click "RUN" to apply the fix');
console.log('4. The security warning will disappear\n');

console.log('═══════════════════════════════════════════════════════════\n');
console.log('✅ After running this SQL, your database will be secure:');
console.log('   • Anyone can READ articles (public news site)');
console.log('   • Only service role can WRITE/UPDATE/DELETE');
console.log('   • Anonymous users cannot modify data\n');
