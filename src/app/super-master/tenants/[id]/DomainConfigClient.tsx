'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { getDomainConfigAction, DomainConfig } from './config-actions';

interface Props {
  tenantId: string;
}

export default function DomainConfigClient({ tenantId }: Props) {
  const [config, setConfig] = useState<DomainConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const result = await getDomainConfigAction(tenantId);
        setConfig(result.config);
      } catch (error) {
        console.error('Failed to load domain config:', error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Domain & Subdomain</h3>
          <p className="text-xs text-slate-500">Custom domain configuration</p>
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isConfigAvailable = config !== null && (config.subdomain !== undefined || config.customDomain !== undefined);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Domain & Subdomain</h3>
        <p className="text-xs text-slate-500">Custom domain configuration</p>
      </div>

      <div className="p-6">
        {!isConfigAvailable ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Domain configuration fields are not yet available in the schema.
              Schema migration required for encrypted credential storage.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Subdomain</label>
                <p className="text-sm text-slate-900 mt-1">
                  {config.subdomain ? `${config.subdomain}.example.com` : 'Not configured'}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Custom Domain</label>
                <p className="text-sm text-slate-900 mt-1">
                  {config.customDomain || 'Not configured'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Verification Status</label>
                <div className="mt-1 flex items-center gap-2">
                  {config.verificationStatus === 'verified' ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700">Verified</span>
                    </>
                  ) : config.verificationStatus === 'pending' ? (
                    <>
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-700">Pending</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-sm text-rose-700">Failed</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">SSL Status</label>
                <div className="mt-1 flex items-center gap-2">
                  {config.sslStatus === 'active' ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700">Active (HTTPS)</span>
                    </>
                  ) : config.sslStatus === 'pending' ? (
                    <>
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-700">Pending</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">Not Configured</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Note: Subdomains follow the pattern: <code>institute-name.example.com</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}