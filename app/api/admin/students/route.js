import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '../../../../lib/authOptions';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('students')
    .select('id, username, name, created_at, self_registered, phone, school')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ students: data });
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, username, password, phone, school } = await request.json();
  if (!name?.trim() || !username?.trim() || !password) {
    return NextResponse.json({ error: 'Name, username, and password are all required.' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const uname = username.trim().toLowerCase();

  const { data: existing } = await supabase.from('students').select('id').eq('username', uname).single();
  if (existing) {
    return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('students')
    // phone/school are optional here (unlike the public /register form,
    // where an admin isn't around to fill them in later) — store null
    // rather than an empty string so the data tab can tell "not provided"
    // apart from an actual blank value.
    .insert({
      name: name.trim(),
      username: uname,
      password_hash: passwordHash,
      phone: phone?.trim() || null,
      school: school?.trim() || null,
    })
    .select('id, username, name, phone, school, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ student: data }, { status: 201 });
}
