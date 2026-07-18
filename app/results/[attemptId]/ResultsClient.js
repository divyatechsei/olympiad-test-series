'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Target, BookOpen, Share2, Download, Sparkles, XIcon, Loader2, Star, Crown, Zap, Medal, Flame } from 'lucide-react';
import { Button, Card } from '../../../components/ui';
import { BADGE_DEFS } from '../../../lib/badges';

const NAVY = '#1a2b4c';
const GOLD = '#d4af37';
const SECTION_INFO = {
  A: { name: 'Logical Reasoning' }, B: { name: 'Mathematical Reasoning' },
  C: { name: 'Everyday Mathematics' }, D: { name: 'Achievers Section' },
};
const BADGE_ICONS = { Star, Crown, Zap, Medal, Trophy, Sparkles, Flame };

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function generateShareImage(canvas, { name, grade, subject, setLabel, marks, maxMarks, finalScore, pct }) {
  const w = 800, h = 500;
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#1a2b4c'); grad.addColorStop(1, '#2d4270');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(212,175,55,0.12)';
  ctx.beginPath(); ctx.arc(700, 80, 120, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(60, 440, 90, 0, Math.PI * 2); ctx.fill();

  try {
    const logo = await loadImage('/techsei-icon.png');
    const logoH = 44;
    const logoW = logoH * (logo.width / logo.height);
    ctx.drawImage(logo, w / 2 - logoW / 2, 24, logoW, logoH);
  } catch {
    // If the logo fails to load, fall back to text-only — never block the share card on it.
    ctx.fillStyle = '#d4af37'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('OLYMPIAD PREP', w / 2, 50);
  }

  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 42px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(name, w / 2, 145);
  ctx.font = '20px sans-serif'; ctx.fillStyle = '#c9d3e8';
  ctx.fillText(`Grade ${grade} ${subject} — Set ${setLabel}`, w / 2, 178);
  ctx.beginPath(); ctx.arc(w / 2, 300, 90, 0, Math.PI * 2);
  ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 56px sans-serif';
  ctx.fillText(`${pct}%`, w / 2, 316);
  ctx.font = '18px sans-serif'; ctx.fillStyle = '#c9d3e8';
  ctx.fillText(`${marks} / ${maxMarks} marks · Final Score: ${finalScore}`, w / 2, 425);
  ctx.font = '14px sans-serif'; ctx.fillStyle = '#8fa0c4';
  ctx.fillText('Think you can beat this score?', w / 2, 465);
}

function ShareModal({ attempt, user, onClose }) {
  const canvasRef = useRef(null);
  const pct = Math.round((attempt.marks / attempt.max_marks) * 100);

  useEffect(() => {
    if (canvasRef.current) {
      generateShareImage(canvasRef.current, { name: user.name, grade: attempt.grade, subject: attempt.subject, setLabel: attempt.set_label, marks: attempt.marks, maxMarks: attempt.max_marks, finalScore: attempt.final_score, pct }).catch(() => {});
    }
  }, [attempt, user]);

  function handleDownload() {
    const link = document.createElement('a');
    link.download = `${user.name.replace(/\s+/g, '_')}_Grade${attempt.grade}${attempt.subject}Set${attempt.set_label}_score.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }

  const shareText = `I scored ${attempt.marks}/${attempt.max_marks} (${pct}%) on Grade ${attempt.grade} ${attempt.subject} Set ${attempt.set_label}! 🏆`;

  async function handleShare() {
    try {
      if (navigator.share) { await navigator.share({ text: shareText }); return; }
    } catch {}
    try {
      await navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard! Paste it anywhere to share.');
    } catch { alert(shareText); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 z-40">
      <Card className="p-6 max-w-lg w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg" style={{ color: NAVY }}>Share your result</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XIcon className="w-5 h-5" /></button>
        </div>
        <canvas ref={canvasRef} className="w-full rounded-xl border border-slate-200 mb-4" />
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={handleDownload}><Download className="w-4 h-4" />Download</Button>
          <Button variant="primary" className="flex-1" onClick={handleShare}><Share2 className="w-4 h-4" />Share</Button>
        </div>
      </Card>
    </div>
  );
}

export default function ResultsClient({ attemptId, user }) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/attempts/${attemptId}`);
      const data = await res.json();
      if (!res.ok) { router.push('/dashboard'); return; }
      setAttempt(data.attempt);

      // Determine which badges were newly unlocked by this attempt
      const allRes = await fetch('/api/attempts');
      const allData = await allRes.json();
      const all = allData.attempts || [];
      const before = all.filter((a) => new Date(a.submitted_at) < new Date(data.attempt.submitted_at));
      const badgesBefore = BADGE_DEFS.filter((b) => b.check(before)).map((b) => b.id);
      const badgesAfter = BADGE_DEFS.filter((b) => b.check(all));
      setNewBadges(badgesAfter.filter((b) => !badgesBefore.includes(b.id)));
    })();
  }, [attemptId, router]);

  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: NAVY }} />
      </div>
    );
  }

  const pct = Math.round((attempt.marks / attempt.max_marks) * 100);
  const passed = pct >= 60;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-cream">
      <div className="w-full max-w-2xl">
        <Card className="p-6 sm:p-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: passed ? '#dcfce7' : '#fee2e2' }}>
            {passed ? <Trophy className="w-10 h-10" style={{ color: '#16a34a' }} /> : <Target className="w-10 h-10 text-red-500" />}
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: NAVY }}>{passed ? 'Great work!' : 'Test complete'}</h1>
          <p className="text-slate-500 text-sm mb-6">Grade {attempt.grade} {attempt.subject} · Set {attempt.set_label} · Completed in {formatTime(attempt.time_taken_seconds)}</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-2xl font-bold" style={{ color: NAVY }}>{attempt.marks}/{attempt.max_marks}</p>
              <p className="text-xs text-slate-400 mt-1">Marks</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-2xl font-bold" style={{ color: NAVY }}>{pct}%</p>
              <p className="text-xs text-slate-400 mt-1">Accuracy</p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: '#fdf6e3' }}>
              <p className="text-2xl font-bold" style={{ color: GOLD }}>{attempt.final_score}</p>
              <p className="text-xs text-slate-400 mt-1">Final score</p>
            </div>
          </div>

          <div className="text-left bg-slate-50 rounded-xl p-4 mb-6 text-xs text-slate-500">
            <p className="font-semibold text-slate-600 mb-1">How your final score is calculated</p>
            <p>Marks earned ({attempt.marks}) + Time bonus (+{attempt.time_bonus}, based on time remaining) = <strong style={{ color: NAVY }}>{attempt.final_score}</strong></p>
          </div>

          <div className="text-left mb-6">
            <p className="font-semibold text-sm mb-2" style={{ color: NAVY }}>Section breakdown</p>
            <div className="space-y-2">
              {Object.entries(attempt.section_breakdown).map(([sec, { correct, total }]) => (
                <div key={sec} className="flex items-center gap-3">
                  <span className="text-xs w-32 text-slate-500 flex-shrink-0">{sec} · {SECTION_INFO[sec].name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(correct / total) * 100}%`, backgroundColor: correct / total >= 0.6 ? '#16a34a' : '#f59e0b' }} />
                  </div>
                  <span className="text-xs text-slate-400 w-10 text-right">{correct}/{total}</span>
                </div>
              ))}
            </div>
          </div>

          {newBadges.length > 0 && (
            <div className="text-left mb-6 rounded-xl p-4" style={{ backgroundColor: '#fdf6e3', border: `1px solid ${GOLD}` }}>
              <p className="font-semibold text-sm mb-2 flex items-center gap-1.5" style={{ color: NAVY }}><Sparkles className="w-4 h-4" style={{ color: GOLD }} />New badge{newBadges.length > 1 ? 's' : ''} unlocked!</p>
              <div className="flex flex-wrap gap-2">
                {newBadges.map((b) => {
                  const Icon = BADGE_ICONS[b.icon];
                  return (
                    <div key={b.id} className="flex items-center gap-1.5 bg-white rounded-full pl-1.5 pr-3 py-1">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: GOLD }}><Icon className="w-3 h-3 text-white" /></div>
                      <span className="text-xs font-semibold" style={{ color: NAVY }}>{b.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => router.push(`/review/${attemptId}`)}><BookOpen className="w-4 h-4" />Review Answers</Button>
            <Button variant="secondary" className="flex-1" onClick={() => setShowShare(true)}><Share2 className="w-4 h-4" />Share Result</Button>
            <Button variant="primary" className="flex-1" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
          </div>
        </Card>
      </div>
      {showShare && <ShareModal attempt={attempt} user={user} onClose={() => setShowShare(false)} />}
    </div>
  );
}
