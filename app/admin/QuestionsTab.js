'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X as XIcon } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { QuestionForm } from './QuestionForm';
import { GRADES, SUBJECTS, SET_LABELS } from '../../lib/catalog';

const NAVY = '#1a2b4c';
const SECTION_COLORS = { A: '#dce6f2', B: '#e2f0d9', C: '#fdf2cc', D: '#f8d7da' };

export function QuestionsTab() {
  const [grade, setGrade] = useState(5);
  const [subject, setSubject] = useState('IMO');
  const [setLabel, setSetLabel] = useState('A');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | question object being edited

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/questions?grade=${grade}&subject=${subject}&setLabel=${setLabel}`);
    const data = await res.json();
    setQuestions(data.questions || []);
    setLoading(false);
  }, [grade, subject, setLabel]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(q) {
    if (!confirm(`Delete question ${q.q_num} from Grade ${grade} ${subject} Set ${setLabel}? This cannot be undone.`)) return;
    await fetch(`/api/admin/questions/${q.id}`, { method: 'DELETE' });
    load();
  }

  const nextQNum = questions.length ? Math.max(...questions.map((q) => q.q_num)) + 1 : 1;
  const missingCount = 35 - questions.length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Grade:</span>
          <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm bg-white">
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Subject:</span>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm bg-white">
            {SUBJECTS.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Set:</span>
          <div className="flex gap-1 flex-wrap">
            {SET_LABELS.map((l) => (
              <button
                key={l}
                onClick={() => setSetLabel(l)}
                className="w-8 h-8 rounded-lg text-xs font-bold"
                style={setLabel === l ? { backgroundColor: NAVY, color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => setModal('add')} className="ml-auto"><Plus className="w-4 h-4" />Add Question</Button>
      </div>

      {!loading && (
        <p className="text-xs text-slate-400 mb-3">
          {questions.length} of 35 questions {missingCount > 0 && <span className="text-amber-600 font-medium">({missingCount} missing — students will hit an error if they start this test before it has all 35)</span>}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : questions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-slate-400">No questions in Grade {grade} {subject} Set {setLabel} yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <Card key={q.id} className="p-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-md" style={{ backgroundColor: SECTION_COLORS[q.section], color: NAVY }}>
                  Q{q.q_num}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 truncate">{q.text}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Section {q.section} · {q.marks} mark{q.marks > 1 ? 's' : ''} · Answer: {q.ans}{q.img_params ? ' · Has diagram' : ''}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setModal(q)} className="text-slate-400 hover:text-slate-700 p-1.5"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(q)} className="text-slate-400 hover:text-red-600 p-1.5"><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-30 py-8 overflow-y-auto">
          <Card className="p-6 max-w-2xl w-full my-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg" style={{ color: NAVY }}>{modal === 'add' ? `Add question — Grade ${grade} ${subject} Set ${setLabel}` : `Edit Q${modal.q_num} · Grade ${grade} ${subject} Set ${setLabel}`}</h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600"><XIcon className="w-5 h-5" /></button>
            </div>
            <QuestionForm
              grade={grade}
              subject={subject}
              setLabel={setLabel}
              nextQNum={nextQNum}
              existing={modal === 'add' ? null : modal}
              onSaved={() => { setModal(null); load(); }}
              onCancel={() => setModal(null)}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
