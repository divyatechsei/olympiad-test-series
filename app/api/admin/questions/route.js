import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/authOptions';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { validateQuestionBody } from '../../../../lib/questionValidation';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') return null;
  return session;
}

export async function GET(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const grade = Number(searchParams.get('grade'));
  const subject = searchParams.get('subject');
  const setLabel = searchParams.get('setLabel');
  if (!grade || !subject || !setLabel) {
    return NextResponse.json({ error: 'grade, subject, and setLabel query params are all required.' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('grade', grade)
    .eq('subject', subject)
    .eq('set_label', setLabel)
    .order('q_num', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data });
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validationError = validateQuestionBody(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('questions')
    .select('id')
    .eq('grade', body.grade)
    .eq('subject', body.subject)
    .eq('set_label', body.setLabel)
    .eq('q_num', body.qNum)
    .single();
  if (existing) {
    return NextResponse.json({ error: `Question ${body.qNum} already exists in Grade ${body.grade} ${body.subject} Set ${body.setLabel}. Edit it instead, or pick a different number.` }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('questions')
    .insert({
      grade: body.grade,
      subject: body.subject,
      set_label: body.setLabel,
      q_num: body.qNum,
      section: body.section,
      marks: body.marks,
      text: body.text.trim(),
      opts: body.opts.map((o) => String(o).trim()),
      ans: body.ans,
      steps: body.steps.map((s) => String(s).trim()).filter(Boolean),
      img_params: body.imgParams || null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data }, { status: 201 });
}
