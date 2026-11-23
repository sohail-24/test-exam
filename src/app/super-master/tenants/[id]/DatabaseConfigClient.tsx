'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, TestTube, CheckCircle, XCircle, Clock, Save, X, Edit3, Loader2 } from 'lucide-react';
import { getDatabaseConfigAction, testDatabaseConnectionAction, saveDatabaseConfigAction, updateDbTestStatusAction, DatabaseConfigStatus } from './config-actions';

interface Props {
  tenantId: string;
}

export default function DatabaseConfigClient({ tenantId }: Props) {
  const [config, setConfig] = useState<DatabaseConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ success: boolean; message: string } | null>(null);

  // Form state
  const [editProvider, setEditProvider] = useState<'postgresql' | 'neon'>('postgresql');
  const [editConnectionString, setEditConnectionString] = useState('');

  useEffect(() => {
    async function loadConfig() {
      try {
        const result = await getDatabaseConfigAction(tenantId);
        setConfig(result.config);
        if (result.config) {
          setEditProvider(result.config.provider === 'neon' ? 'neon' : 'postgresql');
        }
      } catch (error) {
        console.error('Failed to load database config:', error);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [tenantId]);

  const handleEdit = () => {
    setIsEditing(true);
    setSaveMessage(null);
    setTestResult(null);
    setShowPassword(false);
    // Reset connection string for editing
    setEditConnectionString('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditConnectionString('');
    setShowPassword(false);
    setSaveMessage(null);
    setTestResult(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    const result = await saveDatabaseConfigAction(tenantId, {
      provider: editProvider,
      connectionString: editConnectionString,
    });

    if (result.success) {
      setSaveMessage({ success: true, message: 'Database configuration saved successfully.' });
      setIsEditing(false);
      setShowPassword(false);
      // Refresh config
      const refreshResult = await getDatabaseConfigAction(tenantId);
      setConfig(refreshResult.config);
    } else {
      setSaveMessage({ success: false, message: result.error || 'Failed to save configuration.' });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!editConnectionString.trim()) {
      setTestResult({ success: false, message: 'Please enter a connection URL to test.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testDatabaseConnectionAction(tenantId, editConnectionString);
      setTestResult(result);

      // Update test status in database
      await updateDbTestStatusAction(tenantId, result.success ? 'success' : 'failed', result.message);
    } catch {
      setTestResult({ success: false, message: 'Test failed unexpectedly.' });
    } finally {
      setTesting(false);
    }
  };

  // Check if config fields are available in schema
  const isConfigAvailable = config !== null && (config.isConfigured !== undefined || 'provider' in config);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Database Configuration</h3>
          <p className="text-xs text-slate-500">PostgreSQL connection settings</p>
        </div>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
        </div>
      </div>
    );
  }

  // Check if schema migration is needed (no database provider field)
  const needsMigration = !isConfigAvailable;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Database Configuration</h3>
          <p className="text-xs text-slate-500">PostgreSQL connection settings</p>
        </div>
        {!needsMigration && !isEditing && (
          <button
            onClick={handleEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      <div className="p-6">
        {needsMigration ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Database credential storage requires a schema migration.
              Add `databaseProvider`, `databaseCredentials`, `dbLastTestedAt`, `dbTestStatus`, and `dbTestResult` fields to the Tenant model.
            </p>
          </div>
        ) : isEditing ? (
          /* Edit Mode */
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500">Database Provider</label>
              <select
                value={editProvider}
                onChange={(e) => setEditProvider(e.target.value as 'postgresql' | 'neon')}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="neon">Neon (Serverless)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500">Connection URL</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={editConnectionString}
                  onChange={(e) => setEditConnectionString(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  placeholder="postgresql://user:password@host:port/database"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Format: postgresql://user:password@host:port/database
              </p>
            </div>

            {saveMessage && (
              <div className={`p-3 rounded-lg text-sm ${
                saveMessage.success
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-rose-50 text-rose-800'
              }`}>
                {saveMessage.message}
              </div>
            )}

            {testResult && (
              <div className={`p-3 rounded-lg text-sm ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-rose-50 text-rose-800'
              }`}>
                {testResult.message}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || saving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <TestTube className="w-4 h-4" />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Display Mode */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Status</label>
                <div className="mt-1 flex items-center gap-2">
                  {config?.isConfigured ? (
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
                <label className="text-xs font-medium text-slate-500">Provider</label>
                <p className="text-sm font-medium text-slate-900 mt-0.5">
                  {config?.provider ? config.provider.charAt(0).toUpperCase() + config.provider.slice(1) : 'Not set'}
                </p>
              </div>
            </div>

            {config?.maskedConnectionString && (
              <div>
                <label className="text-xs font-medium text-slate-500">Connection String</label>
                <p className="text-sm font-mono text-slate-700 mt-1 break-all">
                  {config.maskedConnectionString}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config && (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-500">Connection Status</label>
                    <div className="mt-1 flex items-center gap-2">
                      {config.connectionStatus === 'configured' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-700">Connected</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-500">Not Connected</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-500">Last Tested</label>
                    <div className="mt-1 flex items-center gap-2">
                      {config.lastTestedAt ? (
                        <>
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {new Date(config.lastTestedAt).toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-slate-500">Never tested</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}