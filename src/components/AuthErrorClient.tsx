'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface AuthErrorClientProps {
  portalTitle: string;
  portalDescription: string;
  brandColor?: 'emerald' | 'slate' | 'rose';
  showBackLink?: boolean;
  backLinkHref?: string;
  backLinkLabel?: string;
}

export default function AuthErrorClient({
  portalTitle,
  portalDescription,
  brandColor = 'emerald',
  showBackLink = true,
  backLinkHref = '/login',
  backLinkLabel = 'Back to login',
}: AuthErrorClientProps) {
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
        case 'CSRF':
          setError('Security verification failed. Please try again.');
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
    router.replace(backLinkHref);
  };

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      icon: 'text-emerald-600',
      button: 'bg-emerald-600 hover:bg-emerald-700',
    },
    slate: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      text: 'text-slate-800',
      icon: 'text-slate-600',
      button: 'bg-slate-900 hover:bg-slate-800',
    },
    rose: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      icon: 'text-rose-600',
      button: 'bg-rose-600 hover:bg-rose-700',
    },
  }[brandColor];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{portalTitle}</h1>
          <p className="text-slate-600">{portalDescription}</p>
        </div>

        <div className={`bg-white rounded-xl border ${colorClasses.border} ${colorClasses.bg} p-6`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-6 flex-shrink-0 mt-0.5 ${colorClasses.icon}`} />
            <div className={`text-sm ${colorClasses.text}`}>
              <p className="font-semibold mb-1">Authentication Error</p>
              <p>{error || 'Please verify your credentials and try again.'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRetry}
          disabled={isRedirecting}
          className={`mt-6 w-full flex items-center justify-center gap-2 ${colorClasses.button} text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50`}
        >
          {isRedirecting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              {showBackLink ? backLinkLabel : 'Try Again'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}