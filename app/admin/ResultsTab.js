'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { AdminAttemptReview } from './AdminAttemptReview';

const NAVY = '#1a2b4c';

function StudentAttemptsList({ username, onBack, onOpenAttempt }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/admin/students/${username}/attempts`);
      const json = await res.json();
      if (res.ok) setData(json);
    })();
  }, [username]);

  if (!data) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: NAVY }} /></div>;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold mb-4" style={{ color: NAVY }}>
        <ArrowLeft className="w-4 h-4" />Back to all students
      </button>
      <h3 className="font-bold text-sm mb-3" style={{ color: NAVY }}>{data.student.name}'s attempts</h3>
      {data.attempts.length === 0 ? (
        <Card className="p-6"><p className="text-sm text-slate-400">No attempts yet.</p></Card>
      ) : (
        <div className="space-y-2">
          {data.attempts.map((a) => {
            const pct = Math.round((a.marks / a.max_marks) * 100);
            return (
              <Card key={a.id} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => onOpenAttempt(a.id)}>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Grade {a.grade} {a.subject} · Set {a.set_label}</p>
                  <p className="text-xs text-slate-400">{new Date(a.submitted_at).toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: NAVY }}>{a.marks}/{a.max_marks} ({pct}%)</p>
                  <p className="text-xs text-slate-400">Final score: {a.final_score}</p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ResultsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState({ mode: 'list' }); // list | student | attempt
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch('/api/admin/results');
      const data = await res.json();
      setStudents(data.students || []);
      setLoading(false);
    })();
  }, []);

  async function handleExport() {
    setExporting(true);
    const res = await fetch('/api/admin/export');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `olympiad_prep_results_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setExporting(false);
  }

  if (view.mode === 'attempt') {
    return <AdminAttemptReview attemptId={view.attemptId} onBack={() => setView({ mode: 'student', username: view.username })} />;
  }
  if (view.mode === 'student') {
    return <StudentAttemptsList username={view.username} onBack={() => setView({ mode: 'list' })} onOpenAttempt={(attemptId) => setView({ mode: 'attempt', attemptId, username: view.username })} />;
  }

  return (
    <Card className="p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-sm" style={{ color: NAVY }}>All student results</h2>
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={exporting || students.length === 0}>
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Export CSV
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-slate-400">No students yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-200">
              <th className="pb-2 pr-4">Student</th>
              <th className="pb-2 pr-4">Tests done</th>
              <th className="pb-2 pr-4">Avg. score</th>
              <th className="pb-2 pr-4">Best score</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const attempts = s.attempts || [];
              const setsCompleted = new Set(attempts.map((a) => `${a.grade}:${a.subject}:${a.set_label}`)).size;
              const avg = attempts.length ? Math.round((attempts.reduce((a, r) => a + r.marks / r.max_marks, 0) / attempts.length) * 100) : null;
              const best = attempts.length ? Math.max(...attempts.map((r) => Math.round((r.marks / r.max_marks) * 100))) : null;
              return (
                <tr key={s.username} className="border-b border-slate-100 cursor-pointer hover:bg-slate-50" onClick={() => setView({ mode: 'student', username: s.username })}>
                  <td className="py-2.5 pr-4 font-medium text-slate-700">{s.name}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{setsCompleted}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{avg !== null ? `${avg}%` : '—'}</td>
                  <td className="py-2.5 pr-4 text-slate-500">{best !== null ? `${best}%` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}
