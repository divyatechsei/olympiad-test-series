import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/authOptions';
import { getSupabaseAdmin } from '../../../../../lib/supabaseAdmin';
import { validateQuestionBody } from '../../../../../lib/questionValidation';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') return null;
  return session;
}

export async function PUT(request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validationError = validateQuestionBody(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: collision } = await supabase
    .from('questions')
    .select('id')
    .eq('grade', body.grade)
    .eq('subject', body.subject)
    .eq('set_label', body.setLabel)
    .eq('q_num', body.qNum)
    .neq('id', params.id)
    .single();
  if (collision) {
    return NextResponse.json({ error: `Question ${body.qNum} already exists in Grade ${body.grade} ${body.subject} Set ${body.setLabel}.` }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('questions')
    .update({
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
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ question: data });
}

export async function DELETE(request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('questions').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
