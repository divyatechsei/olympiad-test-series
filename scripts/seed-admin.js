/**
 * Run once, after setting up your .env.local AND after running both
 * supabase/schema.sql and supabase/migration_002_questions.sql:
 *
 *   node scripts/seed-admin.js
 *
 * You can change the username/password/name below before running,
 * or just run it as-is to get admin / Techsei2025 (matching the
 * prototype), then change the password later via Supabase directly
 * if you want.
 */
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const ADMIN_NAME = 'Administrator';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Techsei2025';

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const { data: existing } = await supabase.from('admins').select('id').eq('username', ADMIN_USERNAME).single();
  if (existing) {
    console.log(`Admin "${ADMIN_USERNAME}" already exists — nothing to do.`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const { error } = await supabase.from('admins').insert({
    name: ADMIN_NAME,
    username: ADMIN_USERNAME,
    password_hash: passwordHash,
  });

  if (error) {
    console.error('Failed to create admin:', error.message);
    process.exit(1);
  }
  console.log(`✅ Admin account created: username="${ADMIN_USERNAME}", password="${ADMIN_PASSWORD}"`);
  console.log('   Sign in at /login using the Admin tab, then change this password by re-running');
  console.log('   this script with a new ADMIN_PASSWORD after deleting the old row in Supabase.');
}

main();
