'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Card, DiagramCanvas } from '../../../../../components/ui';

const NAVY = '#1a2b4c';
const GOLD = '#d4af37';
const SECTION_INFO = {
  A: { name: 'Logical Reasoning' },
  B: { name: 'Mathematical Reasoning' },
  C: { name: 'Everyday Mathematics' },
  D: { name: 'Achievers Section' },
};

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function QuizClient({ grade, subject, setLabel }) {
  const router = useRouter();
  const [questions, setQuestions] = useState(null);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(3600);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/quiz/${grade}/${subject}/${setLabel}`);
      const data = await res.json();
      setQuestions(data.questions);
      setTimeLimitSeconds(data.timeLimitSeconds);
      setTimeLeft(data.timeLimitSeconds);
    })();
  }, [setLabel]);

  const finish = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const res = await fetch(`/api/quiz/${grade}/${subject}/${setLabel}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, timeRemaining: timeLeft }),
    });
    const data = await res.json();
    if (res.ok) {
      router.push(`/results/${data.attempt.id}`);
    } else {
      alert('Something went wrong submitting your test. Please try again.');
      submittedRef.current = false;
      setSubmitting(false);
    }
  }, [answers, timeLeft, setLabel, router]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { finish(); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, finish]);

  if (!questions || timeLeft === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const isLow = timeLeft <= 300;

  function selectAnswer(letter) {
    setAnswers((a) => ({ ...a, [q.qNum]: letter }));
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-sm" style={{ color: NAVY }}>Grade {grade} {subject} · Set {setLabel}</p>
            <p className="text-xs text-slate-400">Question {current + 1} of {questions.length}</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono font-bold text-sm ${isLow ? 'bg-red-50 text-red-600' : 'bg-slate-100'}`} style={!isLow ? { color: NAVY } : {}}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-slate-400">Exit</Button>
        </div>
        <div className="h-1 bg-slate-100">
          <div className="h-full transition-all" style={{ width: `${(answeredCount / questions.length) * 100}%`, backgroundColor: GOLD }} />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex flex-wrap gap-1.5 mb-6">
          {questions.map((qq, i) => {
            const answered = answers[qq.qNum] != null;
            const isCurrent = i === current;
            return (
              <button
                key={qq.qNum}
                onClick={() => setCurrent(i)}
                className="w-7 h-7 rounded-md text-xs font-bold flex items-center justify-center transition-all"
                style={
                  isCurrent
                    ? { backgroundColor: NAVY, color: 'white', transform: 'scale(1.1)' }
                    : answered
                    ? { backgroundColor: '#dcfce7', color: '#16a34a' }
                    : { backgroundColor: 'white', color: '#94a3b8', border: '1px solid #e2e8f0' }
                }
              >
                {qq.qNum}
              </button>
            );
          })}
        </div>

        <Card className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ backgroundColor: '#eef1f8', color: NAVY }}>
              Section {q.section} · {SECTION_INFO[q.section].name}
            </span>
            <span className="text-xs text-slate-400">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
          </div>

          <p className="text-slate-800 text-base sm:text-lg leading-relaxed whitespace-pre-line mb-2">{q.text}</p>

          <DiagramCanvas params={q.imgParams} />

          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {q.opts.map((opt, i) => {
              const letter = 'ABCD'[i];
              const selected = answers[q.qNum] === letter;
              return (
                <button
                  key={letter}
                  onClick={() => selectAnswer(letter)}
                  className="text-left px-4 py-3 rounded-xl border-2 transition-all text-sm flex items-start gap-2.5"
                  style={selected ? { borderColor: NAVY, backgroundColor: '#eef1f8' } : { borderColor: '#e2e8f0', backgroundColor: 'white' }}
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                    style={selected ? { backgroundColor: NAVY, color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}
                  >
                    {letter}
                  </span>
                  <span className="text-slate-700">{opt}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="flex items-center justify-between mt-6">
          <Button variant="secondary" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
            <ChevronLeft className="w-4 h-4" />Previous
          </Button>
          {current === questions.length - 1 ? (
            <Button variant="primary" onClick={() => setConfirmSubmit(true)}>
              Submit Test<CheckCircle2 className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>
              Next<ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">{answeredCount} of {questions.length} answered</p>
      </main>

      {confirmSubmit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-30">
          <Card className="p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2" style={{ color: NAVY }}>Submit this test?</h3>
            <p className="text-sm text-slate-500 mb-1">You've answered {answeredCount} of {questions.length} questions.</p>
            {answeredCount < questions.length && <p className="text-sm text-amber-600 mb-4">{questions.length - answeredCount} question(s) are still unanswered.</p>}
            <div className="flex gap-2 mt-4">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmSubmit(false)} disabled={submitting}>Keep working</Button>
              <Button variant="primary" className="flex-1" onClick={finish} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
