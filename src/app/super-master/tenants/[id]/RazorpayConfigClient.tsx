'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, Copy, Loader2, Shield } from 'lucide-react';
import { getRazorpayConfigAction, testRazorpayConnectionAction, RazorpayConfigStatus } from './config-actions';

interface Props {
  tenantId: string;
}

export default function RazorpayConfigClient({ tenantId }: Props) {
  const [config, setConfig] = useState<RazorpayConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    keyId: '',
    webhookSecret: '',
    testMode: true,
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        const result = await getRazorpayConfigAction(tenantId);
        setConfig(result.config);
        if (result.config) {
          setFormData({
            keyId: result.config.keyId || '',
            webhookSecret: result.config.webhookSecret || '',
            testMode: result.config.testMode ?? true,
          });
        }
      } catch (error) {
        console.error('Failed to load razorpay config:', error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [tenantId]);

  const handleTest = async () => {
    if (!formData.keyId || !formData.webhookSecret) {
      setTestResult({ success: false, message: 'Please enter both Key ID and Webhook Secret' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const result = await testRazorpayConnectionAction(
        tenantId,
        formData.keyId,
        formData.webhookSecret,
        formData.testMode
      );
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Payment Configuration</h3>
          <p className="text-xs text-slate-500">Razorpay payment gateway</p>
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isConfigured = config?.isConfigured ?? false;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Payment Configuration</h3>
        <p className="text-xs text-slate-500">Razorpay payment gateway settings</p>
      </div>

      <div className="p-6 space-y-4">
        {!isConfigured ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Payment configuration fields are not yet available in the schema.
              Schema migration required for encrypted credential storage.
            </p>
          </div>
        ) : (
          config && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Configuration Status</label>
                <div className="mt-1 flex items-center gap-2">
                  {config.connectionStatus === 'configured' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">Configured</span>
                    </>
                  ) : config.connectionStatus === 'test_failed' ? (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span className="text-sm text-rose-700">Test Failed</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">Not Configured</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Test Mode</label>
                <div className="mt-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-900">{config.testMode ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Key ID</label>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded-mono">
                  {config.keyIdMasked || 'Not Available'}
                </span>
                {config.keyId && (
                  <button
                    onClick={() => copyToClipboard(config.keyId as string)}
                    className="p-1 text-slate-500 hover:text-slate-700"
                    title="Copy Key ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {config.razorpaySubscriptionId && (
              <div>
                <label className="text-xs font-medium text-slate-500">Subscription ID</label>
                <p className="text-sm font-mono text-slate-700 mt-1">{config.razorpaySubscriptionId}</p>
              </div>
            )}

            <button
              onClick={handleTest}
              disabled={testing || !isConfigured}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <CreditCard className="w-4 h-4" />
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>

            {testResult && (
              <div className={`p-3 rounded-lg text-sm ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-rose-50 text-rose-800'
              }`}>
                {testResult.message}
              </div>
            )}
          </div>
          )
        )}
      </div>
    </div>
  );
}