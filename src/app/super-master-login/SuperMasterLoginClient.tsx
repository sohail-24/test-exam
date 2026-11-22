'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

export default function SuperMasterLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid Super Master email address.');
      return;
    }

    if (!password) {
      setError('Please enter your Super Master password.');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: trimmedEmail,
        password,
        portal: 'super-master',
        redirect: false,
      });

      if (res?.url) {
        try {
          const parsedUrl = new URL(res.url, window.location.origin);
          if (parsedUrl.searchParams.get('csrf') === 'true') {
            setError(
              'Your browser blocked the login CSRF cookie (common in embedded preview iframes under Brave Shields or strict third-party cookie blocking). Open this app in a standalone browser tab or allow cookies for this site.',
            );
            return;
          }
        } catch {
          // Ignore malformed callback URL and continue normal checks
        }
      }

      if (res?.ok && !res?.error) {
        const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
        const session = await sessionRes.json().catch(() => null);

        if (session?.user?.role === 'SUPER_ADMIN') {
          router.replace('/super-master');
          router.refresh();
          return;
        }

        setError(
          'Credentials were verified, but your browser blocked storing the session cookie (expected inside embedded cross-site iframes under Brave Shields or strict third-party cookie blocking). Open this app in a standalone browser tab or allow cookies for this site.',
        );
        return;
      }

      setError(res?.error || 'Invalid Super Master credentials.');
    } catch {
      setError('Unable to complete sign-in right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 px-4 py-8 sm:px-6 font-[family-name:var(--font-geist-sans)]">
      {/* Top Navigation */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between text-xs text-slate-400">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to LopyTech
        </Link>
        <Link href="/login" className="hover:text-white transition-colors">
          Institute Portal Login
        </Link>
      </div>

      {/* Centered Login Card */}
      <main className="w-full max-w-md mx-auto my-8">
        <div className="bg-white text-slate-900 rounded-2xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Brand Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    LopyTech Platform
                  </p>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    Super Master Login
                  </h1>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Sign in with the centrally configured platform owner credentials to manage
              institutes, plans, and portal access.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm px-3.5 py-3 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="super-master-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Super Master Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="super-master-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="owner@yourdomain.com"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="super-master-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="super-master-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your password"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Sign In to Super Master
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500">
              Restricted to the central Super Master account. Institute admins and students must
              use the{' '}
              <Link href="/login" className="font-semibold text-slate-700 hover:underline">
                Institute Login
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-[11px] text-slate-500">
        LopyTech Multi-Tenant Examination Platform
      </footer>
    </div>
  );
}
