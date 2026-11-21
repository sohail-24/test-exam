'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Loader2 } from 'lucide-react';
import { createTenantBySuperAdminAction } from './actions';

export default function NewTenantPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [plan, setPlan] = useState('starter');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await createTenantBySuperAdminAction(name, adminEmail, plan, adminPassword);
    setSubmitting(false);

    if (res.success) {
      router.push('/super-admin');
      router.refresh();
    } else {
      setError(res.error ?? 'Failed to create tenant.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <Link
          href="/super-admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-800" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Create New Tenant / Client</h1>
              <p className="text-xs text-slate-500">Provision an isolated organization portal</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Organization / Client Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Apex Classes / Horizon Institute"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tenant Admin Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@apexclasses.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Initial Admin Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">Client will use this password to sign in</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subscription Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 bg-white"
              >
                <option value="starter">Starter (₹999/mo)</option>
                <option value="pro">Pro (₹2499/mo)</option>
                <option value="enterprise">Enterprise (Custom)</option>
              </select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Creating Tenant...' : 'Create Tenant'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
