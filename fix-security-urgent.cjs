#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixSecurity() {
  console.log('🔒 Fixing database security policies...\n');

  try {
    // Check current access
    console.log('Step 1: Testing current access level...');
    const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

    const { data: readTest, error: readError } = await anonClient
      .from('medical_news')
      .select('id')
      .limit(1);

    if (!readError) {
      console.log('✓ Public read access is working (this is OK for news)');
    }

    // Test if anon can insert (THIS SHOULD FAIL)
    const { error: insertError } = await anonClient
      .from('medical_news')
      .insert({
        title: 'Test Security',
        category: 'test',
        source: 'test',
        source_url: 'https://test-security-' + Date.now() + '.com',
        published_at: new Date().toISOString()
      });

    if (insertError) {
      console.log('✓ Anonymous INSERT is blocked (GOOD - secure)');
    } else {
      console.log('❌ CRITICAL: Anonymous users CAN insert data!');
      console.log('   This is the security vulnerability Supabase warned about.\n');
    }

    console.log('\n📋 TO FIX THIS SECURITY ISSUE:');
    console.log('1. Go to: https://supabase.com/dashboard/project/qhyrfjletazbsjsfosdl/editor');
    console.log('2. Click on "medical_news" table');
    console.log('3. Go to "RLS Policies" tab');
    console.log('4. DELETE these policies:');
    console.log('   - "Service role can insert news"');
    console.log('   - "Service role can update news"');
    console.log('\n5. CREATE new policies with these EXACT settings:\n');

    console.log('   Policy 1: "Service can write"');
    console.log('   - Operation: INSERT');
    console.log('   - Target role: service_role');
    console.log('   - WITH CHECK: true\n');

    console.log('   Policy 2: "Service can modify"');
    console.log('   - Operation: UPDATE');
    console.log('   - Target role: service_role');
    console.log('   - USING: true');
    console.log('   - WITH CHECK: true\n');

    console.log('6. Save and the security warning should disappear.');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixSecurity();
