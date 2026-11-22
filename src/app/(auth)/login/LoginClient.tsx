'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Building, LogIn, Loader2, AlertCircle, ArrowRight, CheckCircle2, Shield } from 'lucide-react';
import Link from 'next/link';

interface Props {
  initialEmail?: string;
  justRegistered?: boolean;
}

export default function LoginClient({ initialEmail = '', justRegistered = false }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notRegistered, setNotRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setNotRegistered(false);

    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        callbackUrl: '/admin',
        redirect: false,
      });

      if (res?.url) {
        try {
          const parsedUrl = new URL(res.url, window.location.origin);
          if (parsedUrl.searchParams.get('csrf') === 'true') {
            setError(
              'CSRF verification failed because the login cookie was missing or blocked. Ensure cookies are enabled and try again.',
            );
            return;
          }
        } catch {
          // Ignore malformed callback URL and continue normal checks
        }
      }

      if (res?.error) {
        if (res.error === 'ACCOUNT_NOT_FOUND' || res.error.includes('ACCOUNT_NOT_FOUND')) {
          setNotRegistered(true);
        } else {
          setError(res.error);
        }
      } else if (res?.ok) {
        // Verify verified TENANT_ADMIN session before navigating
        const sessionRes = await fetch('/api/auth/session', {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        const session = await sessionRes.json().catch(() => null);

        if (session?.user?.role === 'TENANT_ADMIN' && session?.user?.tenantId) {
          const tenantId = session.user.tenantId;
          const orgName = session.user.orgName || 'Portal';
          router.replace(`/admin?tenant=${tenantId}&org=${encodeURIComponent(orgName)}`);
          router.refresh();
          return;
        }

        setError(
          'Unable to verify an active institute administrator session. Ensure cookies are enabled and sign in with an institute admin account.',
        );
      } else {
        setError('Invalid email or password.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Exam Portal Login</h1>
            <p className="text-xs text-slate-500">Sign in to your institute administrator portal</p>
          </div>
        </div>

        {justRegistered && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Portal registered successfully. Enter your password to sign in.</span>
          </div>
        )}

        {notRegistered && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <strong className="font-semibold">Portal Not Found:</strong>
                <p className="mt-0.5 text-amber-800">
                  No organization portal exists for <code className="font-mono font-bold">{email}</code>. If Super Admin hasn&apos;t provisioned your institute, you can register and pick a subscription plan below.
                </p>
              </div>
            </div>
            <Link
              href={`/onboard?email=${encodeURIComponent(email)}`}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              Register & Choose Plan <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setNotRegistered(false);
                setError(null);
              }}
              placeholder="admin@yourinstitute.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"

            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 rounded-xl text-sm transition-colors shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider & Registration Link */}
        <div className="pt-2 border-t border-slate-100 space-y-3 text-center">
          <p className="text-xs text-slate-500">
            Don&apos;t have an exam portal yet?
          </p>
          <Link
            href="/onboard"
            className="inline-flex items-center justify-center gap-1.5 w-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 rounded-xl transition-colors"
          >
            Register / Sign Up & Choose Plan <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
          <div className="pt-1">
            <Link
              href="/super-master-login"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600"
            >
              <Shield className="w-3 h-3" /> Super Master Portal Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
