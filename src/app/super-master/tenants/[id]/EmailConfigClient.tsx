'use client';

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Clock, Copy, Loader2 } from 'lucide-react';
import { getEmailConfigAction, testResendConnectionAction, EmailConfigStatus } from './config-actions';
import { maskValue } from '@/lib/encryption';

interface Props {
  tenantId: string;
}

export default function EmailConfigClient({ tenantId }: Props) {
  const [config, setConfig] = useState<EmailConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const result = await getEmailConfigAction(tenantId);
        setConfig(result.config);
      } catch (error) {
        console.error('Failed to load email config:', error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [tenantId]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testResendConnectionAction();
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
          <h3 className="font-semibold text-slate-900">Email Configuration</h3>
          <p className="text-xs text-slate-500">Resend SMTP API settings</p>
        </div>
        <div className="p-6 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isConfigAvailable = config !== null && (config.isConfigured !== undefined);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-900">Email Configuration</h3>
        <p className="text-xs text-slate-500">Resend SMTP API settings</p>
      </div>

      <div className="p-6">
        {!isConfigAvailable ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Email configuration fields are not yet available in the schema.
              Schema migration required for encrypted credential storage.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500">API Key Status</label>
                <div className="mt-1 flex items-center gap-2">
                  {config.isConfigured ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">Configured</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-500">Not Configured</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Connection Status</label>
                <div className="mt-1 flex items-center gap-2">
                  {config.connectionStatus === 'configured' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">Connected</span>
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
            </div>

            {config.isConfigured && config.apiKey && (
              <div>
                <label className="text-xs font-medium text-slate-500">API Key</label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded-mono">
                    {showApiKey ? config.apiKey : maskValue(config.apiKey)}
                  </span>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-1 text-slate-500 hover:text-slate-700"
                    title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                  >
                    {showApiKey ? <XCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  {showApiKey && config.apiKey && (
                    <button
                      onClick={() => copyToClipboard(config.apiKey as string)}
                      className="p-1 text-slate-500 hover:text-slate-700"
                      title="Copy API Key"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {config.isConfigured && config.senderEmail && (
              <div>
                <label className="text-xs font-medium text-slate-500">Sender Email</label>
                <p className="text-sm font-mono text-slate-700 mt-1">{config.senderEmail}</p>
              </div>
            )}

            {config.isConfigured && config.senderName && (
              <div>
                <label className="text-xs font-medium text-slate-500">Sender Name</label>
                <p className="text-sm text-slate-900 mt-1">{config.senderName}</p>
              </div>
            )}

            <button
              onClick={handleTest}
              disabled={testing || !config}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Mail className="w-4 h-4" />
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
        )}
      </div>
    </div>
  );
}