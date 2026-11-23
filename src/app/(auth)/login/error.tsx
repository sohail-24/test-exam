'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const csrfParam = searchParams.get('csrf');

    if (csrfParam === 'true') {
      setError('CSRF verification failed. The authentication request was blocked for security reasons.');
      return;
    }

    if (errorParam) {
      switch (errorParam) {
        case 'VerificationError':
          setError('Account verification failed. Please contact support.');
          break;
        case 'AccessDenied':
          setError('Access denied. You do not have permission to access this portal.');
          break;
        default:
          setError(`Authentication error: ${errorParam}`);
      }
    }
  }, [searchParams]);

  const handleRetry = () => {
    setIsRedirecting(true);
    router.replace('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Exam Portal Login</h1>
          <p className="text-slate-600">Sign in to your institute administrator portal</p>
        </div>

        <div className="bg-white rounded-xl border border-rose-200 bg-rose-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-6 flex-shrink-0 mt-0.5 text-rose-600" />
            <div className="text-sm text-rose-800">
              <p className="font-semibold mb-1">Authentication Error</p>
              <p>{error || 'Please verify your credentials and try again.'}</p>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleRetry(); }}>
          <button
            type="submit"
            disabled={isRedirecting}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isRedirecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Back to Login
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}