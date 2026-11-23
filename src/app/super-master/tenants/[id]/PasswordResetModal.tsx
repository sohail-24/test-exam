'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, X } from 'lucide-react';
import { resetAdminPasswordAction } from './admin-actions';

interface Props {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordResetModal({ tenantId, isOpen, onClose }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await resetAdminPasswordAction(tenantId, password);
      if (result.success) {
        setSuccess('Password reset successfully.');
        setPassword('');
        setConfirmPassword('');
        // Close modal after 1.5 seconds
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1500);
      } else {
        setError(result.error || 'Failed to reset password.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Reset Admin Password</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg p-3">
              {success}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="• • • • • •"
              minLength={6}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="• • • • • •"
              minLength={6}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || password.length < 6 || password !== confirmPassword}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Reset Password
              </>
            )}
          </button>
        </form>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 rounded-b-xl">
          <p className="text-xs text-slate-500">
            The new password will be sent to the admin via secure channel.
          </p>
        </div>
      </div>
    </div>
  );
}