'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Trophy, LogOut, CheckCircle2, Star, Crown, Zap, Medal, Sparkles, Flame, ChevronLeft, Lock, AlertTriangle } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { BADGE_DEFS } from '../../lib/badges';

const NAVY = '#1a2b4c';
const GOLD = '#d4af37';
const BADGE_ICONS = { Star, Crown, Zap, Medal, Trophy, Sparkles, Flame };

const BLOCKED_MESSAGES = {
  invalid_grade: 'That grade doesn\'t exist. Please pick one from the list below.',
  invalid_subject: 'That subject doesn\'t exist. Please pick one from the list below.',
  invalid_set: 'That test set doesn\'t exist. Please pick one from the list below.',
  unlock_check_failed: 'Could not check whether that test is unlocked — there may be a database connection issue. Try again, and let your admin know if this keeps happening.',
  locked: 'That test isn\'t unlocked yet for you. Ask your admin to unlock it in Admin → Unlocks (all three levels — grade, subject, and set — need to be switched on).',
};

export default function DashboardClient({ user }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const blockedReason = searchParams.get('blocked');
  const [attempts, setAttempts] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [attemptsRes, catalogRes] = await Promise.all([
      fetch('/api/attempts'),
      fetch('/api/catalog'),
    ]);
    const attemptsData = await attemptsRes.json();
    const catalogData = await catalogRes.json();
    setAttempts(attemptsData.attempts || []);
    setCatalog(catalogData.catalog || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const bestByKey = useMemo(() => {
    const map = {};
    attempts.forEach((r) => {
      const key = `${r.grade}:${r.subject}:${r.set_label}`;
      if (!map[key] || r.marks > map[key].marks) map[key] = r;
    });
    return map;
  }, [attempts]);

  const earnedBadges = useMemo(() => BADGE_DEFS.filter((b) => b.check(attempts)), [attempts]);
  const completedCount = Object.keys(bestByKey).length;
  const overallAvg = attempts.length ? Math.round((attempts.reduce((a, r) => a + r.marks / r.max_marks, 0) / attempts.length) * 100) : 0;

  const gradeEntry = catalog.find((g) => g.grade === selectedGrade);
  const subjectEntry = gradeEntry?.subjects.find((s) => s.code === selectedSubject);

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/techsei-icon.png" alt="Techsei" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="font-bold text-sm" style={{ color: NAVY }}>Hi, {user.name.split(' ')[0]} 👋</h1>
              <p className="text-xs text-slate-400">Olympiad Prep</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/login' })} className="text-slate-600"><LogOut className="w-4 h-4" />Sign out</Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {blockedReason && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{BLOCKED_MESSAGES[blockedReason] || 'That test couldn\'t be opened.'}</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
          <Card className="p-4 sm:p-5 text-center">
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>{completedCount}</p>
            <p className="text-xs text-slate-400 mt-1">Tests completed</p>
          </Card>
          <Card className="p-4 sm:p-5 text-center">
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>{overallAvg}%</p>
            <p className="text-xs text-slate-400 mt-1">Average score</p>
          </Card>
          <Card className="p-4 sm:p-5 text-center">
            <p className="text-2xl sm:text-3xl font-bold" style={{ color: NAVY }}>{earnedBadges.length}<span className="text-slate-300 text-lg">/{BADGE_DEFS.length}</span></p>
            <p className="text-xs text-slate-400 mt-1">Badges earned</p>
          </Card>
        </div>

        {earnedBadges.length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold text-sm mb-3" style={{ color: NAVY }}>Your badges</h2>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map((b) => {
                const Icon = BADGE_ICONS[b.icon];
                return (
                  <div key={b.id} className="flex items-center gap-2 bg-white border-2 rounded-full pl-2 pr-3.5 py-1.5" style={{ borderColor: GOLD }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: GOLD }}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: NAVY }}>{b.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : catalog.length === 0 ? (
          <Card className="p-8 text-center">
            <Lock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">No tests are available yet</p>
            <p className="text-xs text-slate-400 mt-1">Ask your admin to unlock a grade and subject for you.</p>
          </Card>
        ) : !selectedGrade ? (
          <>
            <h2 className="font-bold text-sm mb-3" style={{ color: NAVY }}>Choose a grade</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {catalog.map((g) => (
                <Card key={g.grade} className="p-5 text-center cursor-pointer hover:shadow-md" onClick={() => setSelectedGrade(g.grade)}>
                  <p className="text-2xl font-bold" style={{ color: NAVY }}>{g.grade}</p>
                  <p className="text-xs text-slate-400 mt-1">Grade</p>
                </Card>
              ))}
            </div>
          </>
        ) : !selectedSubject ? (
          <>
            <button onClick={() => setSelectedGrade(null)} className="flex items-center gap-1.5 text-sm font-semibold mb-4" style={{ color: NAVY }}>
              <ChevronLeft className="w-4 h-4" />All grades
            </button>
            <h2 className="font-bold text-sm mb-3" style={{ color: NAVY }}>Grade {selectedGrade} · Choose a subject</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {gradeEntry.subjects.map((s) => (
                <Card key={s.code} className="p-5 cursor-pointer hover:shadow-md" onClick={() => setSelectedSubject(s.code)}>
                  <p className="font-semibold text-sm text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.sets.length} test{s.sets.length !== 1 ? 's' : ''} available</p>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setSelectedSubject(null)} className="flex items-center gap-1.5 text-sm font-semibold mb-4" style={{ color: NAVY }}>
              <ChevronLeft className="w-4 h-4" />{subjectEntry?.name}
            </button>
            <h2 className="font-bold text-sm mb-3" style={{ color: NAVY }}>Grade {selectedGrade} · {subjectEntry?.name} · Test series</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {subjectEntry?.sets.map((label) => {
                const key = `${selectedGrade}:${selectedSubject}:${label}`;
                const best = bestByKey[key];
                const pct = best ? Math.round((best.marks / best.max_marks) * 100) : null;
                return (
                  <Card key={label} className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg"
                        style={best ? { backgroundColor: '#e8f5ee', color: '#16a34a' } : { backgroundColor: '#eef1f8', color: NAVY }}
                      >
                        {best ? <CheckCircle2 className="w-5 h-5" /> : label}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-slate-800">Set {label}</p>
                        <p className="text-xs text-slate-400">{best ? `Best: ${best.marks}/${best.max_marks} (${pct}%)` : '35 questions · 60 min'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      <Button variant={best ? 'secondary' : 'primary'} size="sm" onClick={() => router.push(`/quiz/${selectedGrade}/${selectedSubject}/${label}`)}>
                        {best ? 'Retake' : 'Start'}
                      </Button>
                      {best && (
                        <button onClick={() => router.push(`/review/${best.id}`)} className="text-xs font-medium text-slate-400 hover:text-slate-600">
                          View review
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
