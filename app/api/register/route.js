import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

// Public endpoint — no session required. Anyone can create their own
// student account here. New accounts are marked self_registered = true
// (migration_006) purely for display in the admin panel — it has no
// effect on access. Once created, the account sees the same globally
// unlocked tests as any other student, plus anything an admin grants
// it personally in Admin -> Student Access.
const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;
const PHONE_RE = /^[0-9+()\- ]{7,20}$/;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  const usernameRaw = (body.username || '').trim().toLowerCase();
  const password = body.password || '';
  const phone = (body.phone || '').trim();
  const school = (body.school || '').trim();

  if (!name || !usernameRaw || !password || !phone || !school) {
  return NextResponse.json({ error: 'Name, username, password, phone, and school are all required.' }, { status: 400 });
  }
  if (!USERNAME_RE.test(usernameRaw)) {
    return NextResponse.json(
      { error: 'Username must be 3-20 characters: lowercase letters, numbers, dots, or underscores only.' },
      { status: 400 }
    );
  }
  if (usernameRaw === 'admin') {
    return NextResponse.json({ error: 'That username is reserved.' }, { status: 409 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  if (!PHONE_RE.test(phone)) {                                     // ← NEW
    return NextResponse.json(
      { error: 'Please enter a valid phone number.' },
      { status: 400 }
    );
  }
  if (school.length > 200) {                                       // ← NEW
    return NextResponse.json({ error: 'School name is too long.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Usernames aren't shared across the students/admins tables, but we
  // check both so a student can never accidentally shadow an admin
  // username (and vice versa) — it would be confusing at the login
  // screen even though the tables are otherwise independent.
  const [{ data: existingStudent }, { data: existingAdmin }] = await Promise.all([
    supabase.from('students').select('id').eq('username', usernameRaw).single(),
    supabase.from('admins').select('id').eq('username', usernameRaw).single(),
  ]);
  if (existingStudent || existingAdmin) {
    return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('students')
    .insert({
      name,
      username: usernameRaw,
      password_hash: passwordHash,
      phone,        // ← NEW
      school,       // ← NEW
      self_registered: true,
    })
    .select('id, username, name, phone, school, created_at')   // ← phone/school added to returned fields
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ student: data }, { status: 201 });
}
