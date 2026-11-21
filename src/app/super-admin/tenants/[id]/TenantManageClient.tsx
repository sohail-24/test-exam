'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2, Power, ShieldAlert } from 'lucide-react';
import { toggleTenantStatusAction, updateTenantPlanAction, deleteTenantAction } from './actions';

interface Props {
  tenantId: string;
  currentStatus: boolean;
  currentPlan: string;
}

export default function TenantManageClient({ tenantId, currentStatus, currentPlan }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [plan, setPlan] = useState(currentPlan);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleToggleStatus = async () => {
    setLoadingStatus(true);
    try {
      await toggleTenantStatusAction(tenantId, status);
      setStatus(!status);
      router.refresh();
    } finally {
      setLoadingStatus(false);
    }
  };

  const handlePlanChange = async (newPlan: string) => {
    setPlan(newPlan);
    setLoadingPlan(true);
    try {
      await updateTenantPlanAction(tenantId, newPlan);
      router.refresh();
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to completely delete this tenant and all its data? This cannot be undone.')) {
      return;
    }
    setLoadingDelete(true);
    try {
      await deleteTenantAction(tenantId);
      router.push('/super-admin');
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Plan Selector */}
      <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 text-xs">
        <span className="text-slate-500 pl-2 font-medium">Plan:</span>
        <select
          value={plan}
          disabled={loadingPlan}
          onChange={(e) => handlePlanChange(e.target.value)}
          className="bg-transparent font-semibold text-slate-800 pr-2 py-1 focus:outline-none capitalize cursor-pointer"
        >
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        {loadingPlan && <Loader2 className="w-3 h-3 animate-spin text-slate-500" />}
      </div>

      {/* Toggle Active/Inactive */}
      <button
        onClick={handleToggleStatus}
        disabled={loadingStatus}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          status
            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        {loadingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
        {status ? 'Deactivate' : 'Activate'}
      </button>

      {/* Delete Tenant */}
      <button
        onClick={handleDelete}
        disabled={loadingDelete}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
      >
        {loadingDelete ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        Delete
      </button>
    </div>
  );
}
