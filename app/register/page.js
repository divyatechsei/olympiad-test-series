'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { Button, Card } from '../../components/ui';

const NAVY = '#1a2b4c';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setError(data.error || 'Something went wrong. Please try again.');
      return;
    }

    // Sign the new account in right away so they land straight on
    // their dashboard instead of re-typing what they just typed.
    const signInRes = await signIn('credentials', {
      username, password, role: 'student', redirect: false,
    });
    setLoading(false);

    if (signInRes?.error) {
      router.push('/login');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(160deg, #f7f5f0 0%, #eef1f8 100%)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/techsei-logo.png" alt="Techsei" className="h-24 w-auto mx-auto mb-3" />
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>Create your account</h1>
          <p className="text-slate-500 mt-1 text-sm">by Techsei · Olympiad practice tests</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy text-sm"
                placeholder="e.g. Priya Sharma"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Choose a username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy text-sm"
                placeholder="e.g. priya23"
                autoComplete="username"
              />
              <p className="text-[11px] text-slate-400 mt-1">3-20 characters: lowercase letters, numbers, dots, or underscores.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Choose a password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy text-sm pr-10"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm password</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy text-sm"
                placeholder="Retype your password"
                autoComplete="new-password"
              />
            </div>

            <div className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
              <span>You'll see whatever tests your admin has made available, plus anything they unlock for you personally.</span>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !name || !username || !password || !confirmPassword}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create account
            </Button>
          </form>
        </Card>
        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account? <Link href="/login" className="font-semibold" style={{ color: NAVY }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
