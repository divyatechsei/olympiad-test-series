'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, Check, XIcon, Loader2 } from 'lucide-react';
import { Card, DiagramCanvas } from '../../../components/ui';

const NAVY = '#1a2b4c';

export default function ReviewClient({ attemptId }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/attempts/${attemptId}`);
      const data = await res.json();
      if (!res.ok) { router.push('/dashboard'); return; }
      setAttempt(data.attempt);
      setQuestions(data.questions);
    })();
  }, [attemptId, router]);

  if (!attempt || !questions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  const filtered = questions.filter((q) => {
    const selected = attempt.answers[String(q.qNum)];
    const isCorrect = selected === q.ans;
    if (filter === 'correct') return isCorrect;
    if (filter === 'incorrect') return !isCorrect;
    return true;
  });

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: NAVY }}>
            <ArrowLeft className="w-4 h-4" />Back
          </button>
          <p className="font-bold text-sm" style={{ color: NAVY }}>Grade {attempt.grade} {attempt.subject} · Set {attempt.set_label} · Review</p>
          <div className="w-12" />
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-3 flex gap-2">
          {['all', 'correct', 'incorrect'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
              style={filter === f ? { backgroundColor: NAVY, color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}
            >
              {f}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {filtered.map((q) => {
          const selected = attempt.answers[String(q.qNum)];
          const isCorrect = selected === q.ans;
          return (
            <Card key={q.qNum} className="p-5 sm:p-6">
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

              <p className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-2">{q.text}</p>
              <DiagramCanvas params={q.imgParams} />

              <div className="grid sm:grid-cols-2 gap-2 mt-4 mb-4">
                {q.opts.map((opt, i) => {
                  const letter = 'ABCD'[i];
                  const isAns = letter === q.ans;
                  const isSelected = letter === selected;
                  let style = { borderColor: '#e2e8f0', backgroundColor: 'white' };
                  if (isAns) style = { borderColor: '#16a34a', backgroundColor: '#f0fdf4' };
                  else if (isSelected && !isAns) style = { borderColor: '#ef4444', backgroundColor: '#fef2f2' };
                  return (
                    <div key={letter} className="text-left px-3.5 py-2.5 rounded-lg border-2 text-sm flex items-center gap-2.5" style={style}>
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

              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Solution</p>
                <ol className="space-y-1.5">
                  {(q.steps || []).map((step, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-slate-300 flex-shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          );
        })}
      </main>
    </div>
  );
}
