'use client';

import { useState } from 'react';
import { Lock, UserPlus, Loader2 } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface Props {
  onAdminPasswordReset: () => void;
}

export default function TenantManageClient({ onAdminPasswordReset }: Props) {
  const [signingOut, setSigningOut] = useState(false);

  const handleLoginAsAdmin = async () => {
    // First sign out the Super Admin session
    // Then redirect to login page for Institute Admin authentication
    setSigningOut(true);
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={onAdminPasswordReset}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <Lock className="w-4 h-4" />
        Reset Admin Password
      </button>
      <button
        onClick={handleLoginAsAdmin}
        disabled={signingOut}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
      >
        {signingOut ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        {signingOut ? 'Signing out...' : 'Login as Institute Admin'}
      </button>
    </div>
  );
}