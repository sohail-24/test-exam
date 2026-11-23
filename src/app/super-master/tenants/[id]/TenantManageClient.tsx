'use client';

import { Lock } from 'lucide-react';

interface Props {
  onAdminPasswordReset: () => void;
}

export default function TenantManageClient({ onAdminPasswordReset }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={onAdminPasswordReset}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <Lock className="w-4 h-4" />
        Reset Admin Password
      </button>
    </div>
  );
}