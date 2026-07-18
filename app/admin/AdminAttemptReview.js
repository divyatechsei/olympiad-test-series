'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Check, X as XIcon, Loader2 } from 'lucide-react';
import { Card, DiagramCanvas } from '../../components/ui';

const NAVY = '#1a2b4c';

export function AdminAttemptReview({ attemptId, onBack }) {
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/attempts/${attemptId}`);
      const data = await res.json();
      if (res.ok) { setAttempt(data.attempt); setQuestions(data.questions); }
    })();
  }, [attemptId]);

  if (!attempt || !questions) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: NAVY }} /></div>;
  }

  const pct = Math.round((attempt.marks / attempt.max_marks) * 100);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold mb-4" style={{ color: NAVY }}>
        <ArrowLeft className="w-4 h-4" />Back to attempts
      </button>

      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="font-bold text-sm" style={{ color: NAVY }}>{attempt.students?.name} · Grade {attempt.grade} {attempt.subject} · Set {attempt.set_label}</p>
            <p className="text-xs text-slate-400">{new Date(attempt.submitted_at).toLocaleString('en-IN')}</p>
          </div>
          <div className="flex gap-4 text-center">
            <div><p className="text-lg font-bold" style={{ color: NAVY }}>{attempt.marks}/{attempt.max_marks}</p><p className="text-xs text-slate-400">Marks</p></div>
            <div><p className="text-lg font-bold" style={{ color: NAVY }}>{pct}%</p><p className="text-xs text-slate-400">Accuracy</p></div>
            <div><p className="text-lg font-bold" style={{ color: '#d4af37' }}>{attempt.final_score}</p><p className="text-xs text-slate-400">Final</p></div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {questions.map((q) => {
          const selected = attempt.answers[String(q.qNum)];
          const isCorrect = selected === q.ans;
          return (
            <Card key={q.qNum} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: '#eef1f8', color: NAVY }}>
                  Q{q.qNum} · Section {q.section}
                </span>
                {isCorrect ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600"><CheckCircle2 className="w-4 h-4" />Correct</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-red-500"><XCircle className="w-4 h-4" />{selected ? 'Incorrect' : 'Not answered'}</span>
                )}
              </div>
              <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-line mb-2">{q.text}</p>
              <DiagramCanvas params={q.imgParams} />
              <div className="grid sm:grid-cols-2 gap-2 mt-3">
                {q.opts.map((opt, i) => {
                  const letter = 'ABCD'[i];
                  const isAns = letter === q.ans;
                  const isSelected = letter === selected;
                  let style = { borderColor: '#e2e8f0', backgroundColor: 'white' };
                  if (isAns) style = { borderColor: '#16a34a', backgroundColor: '#f0fdf4' };
                  else if (isSelected && !isAns) style = { borderColor: '#ef4444', backgroundColor: '#fef2f2' };
                  return (
                    <div key={letter} className="text-left px-3 py-2 rounded-lg border-2 text-sm flex items-center gap-2" style={style}>
                      <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={isAns ? { backgroundColor: '#16a34a', color: 'white' } : isSelected ? { backgroundColor: '#ef4444', color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}>
                        {letter}
                      </span>
                      <span className="text-slate-700 flex-1">{opt}</span>
                      {isAns && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
                      {isSelected && !isAns && <XIcon className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
