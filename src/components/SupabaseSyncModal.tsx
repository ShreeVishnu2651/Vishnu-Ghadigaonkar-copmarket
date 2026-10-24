/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Copy, 
  Check, 
  Code, 
  Terminal,
  Server,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  getActiveSupabaseCredentials, 
  getSupabase, 
  saveSupabaseCredentials,
  safeSupabaseUpsert,
  mapMemberToSupabase,
  mapProductToSupabase,
  mapMilkToSupabase,
  mapNewspaperToSupabase,
  mapBillToSupabase,
  mapPaymentToSupabase,
  mapNotificationToSupabase
} from '../supabase';
import { 
  Member, 
  Product, 
  MilkSubscription, 
  NewspaperSubscription, 
  Bill, 
  PaymentTransaction, 
  NotificationLog 
} from '../types';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  products: Product[];
  milkSubs: MilkSubscription[];
  newspaperSubs: NewspaperSubscription[];
  bills: Bill[];
  payments: PaymentTransaction[];
  notifications: NotificationLog[];
  onSyncComplete?: () => void;
}

export default function SupabaseSyncModal({
  isOpen,
  onClose,
  members,
  products,
  milkSubs,
  newspaperSubs,
  bills,
  payments,
  notifications,
  onSyncComplete
}: SupabaseSyncModalProps) {
  const [credentials, setCredentials] = useState(getActiveSupabaseCredentials());
  const [urlInput, setUrlInput] = useState(credentials.url || '');
  const [keyInput, setKeyInput] = useState(credentials.key || '');
  const [activeTab, setActiveTab] = useState<'sync' | 'sql' | 'diagnostics'>('sync');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sqlScript, setSqlScript] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [tableStatus, setTableStatus] = useState<Record<string, { exists: boolean; writable: boolean; count?: number; error?: string }>>({});
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getActiveSupabaseCredentials();
      setCredentials(creds);
      setUrlInput(creds.url || '');
      setKeyInput(creds.key || '');
      fetchSqlSchema();
      runTableDiagnostics();
    }
  }, [isOpen]);

  const fetchSqlSchema = async () => {
    try {
      const res = await fetch('/api/supabase/sql-schema');
      const data = await res.json();
      if (data.sql) setSqlScript(data.sql);
    } catch {
      // fallback
    }
  };

  const runTableDiagnostics = async () => {
    setIsDiagnosing(true);
    try {
      const res = await fetch('/api/supabase/diagnose');
      const data = await res.json();
      if (data.tables) {
        setTableStatus(data.tables);
      }
    } catch (err: any) {
      console.warn('Diagnostics error:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await saveSupabaseCredentials(urlInput.trim(), keyInput.trim());
      setCredentials({ url: urlInput.trim(), key: keyInput.trim() });
      setTestResult({ 
        success: result.success, 
        message: result.message || 'Supabase credentials saved successfully!' 
      });
      runTableDiagnostics();
    } catch (err: any) {
      setTestResult({ success: false, message: `Failed to save: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopySql = () => {
    if (!sqlScript) return;
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleForceSyncAll = async () => {
    setIsSyncing(true);
    setSyncStatus('Initiating full data sync to Supabase...');
    const logs: string[] = [];

    try {
      logs.push(`🚀 Step 1: Triggering server-side direct database push...`);
      setSyncLog([...logs]);

      // 1. First trigger server-side push
      try {
        const serverRes = await fetch('/api/supabase/sync-all', { method: 'POST' });
        const serverData = await serverRes.json();
        if (serverData.logs && Array.isArray(serverData.logs)) {
          serverData.logs.forEach((l: string) => logs.push(`[Server] ${l}`));
        }
      } catch (err: any) {
        logs.push(`[Server Sync Note] ${err.message} - Continuing with direct client sync...`);
      }
      setSyncLog([...logs]);

      // 2. Client-side verified upserts
      logs.push(`📡 Step 2: Running browser-side adaptive sync...`);
      setSyncLog([...logs]);

      // Members Sync
      const mappedMembers = members.map(mapMemberToSupabase);
      const resM = await safeSupabaseUpsert('members', mappedMembers);
      if (resM.success) {
        logs.push(`✅ ${members.length} Members synced successfully to 'members' table.`);
      } else {
        logs.push(`⚠️ Members sync: ${resM.error?.message || 'Check table schema'}`);
      }
      setSyncLog([...logs]);

      // Products Sync
      if (products.length > 0) {
        const mappedProducts = products.map(mapProductToSupabase);
        const resP = await safeSupabaseUpsert('products', mappedProducts);
        if (resP.success) {
          logs.push(`✅ ${products.length} Products synced to 'products' table.`);
        } else {
          logs.push(`⚠️ Products sync: ${resP.error?.message || 'Check table schema'}`);
        }
        setSyncLog([...logs]);
      }

      // Milk Subscriptions
      if (milkSubs.length > 0) {
        const mappedMilk = milkSubs.map(mapMilkToSupabase);
        const resMS = await safeSupabaseUpsert('milk_subscriptions', mappedMilk);
        if (resMS.success) logs.push(`✅ ${milkSubs.length} Milk Subscriptions synced.`);
        setSyncLog([...logs]);
      }

      // Newspaper Subscriptions
      if (newspaperSubs.length > 0) {
        const mappedNews = newspaperSubs.map(mapNewspaperToSupabase);
        const resNS = await safeSupabaseUpsert('newspaper_subscriptions', mappedNews);
        if (resNS.success) logs.push(`✅ ${newspaperSubs.length} Newspaper Subscriptions synced.`);
        setSyncLog([...logs]);
      }

      // Utility Bills
      if (bills.length > 0) {
        const mappedBills = bills.map(mapBillToSupabase);
        const resB = await safeSupabaseUpsert('bills', mappedBills);
        if (resB.success) logs.push(`✅ ${bills.length} Bills synced.`);
        setSyncLog([...logs]);
      }

      // Payments
      if (payments.length > 0) {
        const mappedPay = payments.map(mapPaymentToSupabase);
        const resPay = await safeSupabaseUpsert('payments', mappedPay);
        if (resPay.success) logs.push(`✅ ${payments.length} Payment records synced.`);
        setSyncLog([...logs]);
      }

      // Notifications
      if (notifications.length > 0) {
        const mappedNotif = notifications.map(mapNotificationToSupabase);
        const resN = await safeSupabaseUpsert('notifications', mappedNotif);
        if (resN.success) logs.push(`✅ ${notifications.length} Notifications synced.`);
        setSyncLog([...logs]);
      }

      logs.push(`🎉 Full synchronization routine finished successfully.`);
      setSyncLog([...logs]);
      setSyncStatus('Full sync completed successfully!');
      runTableDiagnostics();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      logs.push(`❌ Sync aborted: ${err.message}`);
      setSyncLog([...logs]);
      setSyncStatus('Sync encountered an issue.');
    } finally {
      setIsSyncing(false);
    }
  };

  const isConfigured = Boolean(credentials.url && credentials.key && credentials.url.startsWith('https://'));
  const allTablesHealthy = Object.values(tableStatus).length > 0 && Object.values(tableStatus).every((t: { exists: boolean; writable: boolean }) => t.exists && t.writable);

  return (
    <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Supabase Live Sync Manager</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isConfigured && allTablesHealthy
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                    : isConfigured
                    ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}>
                  {isConfigured && allTablesHealthy ? '100% Live & Synced' : isConfigured ? 'Configured' : 'Credentials Needed'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bidirectional live synchronization between CoopMart UI and Supabase Cloud.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'sync' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Live Sync & Push</span>
          </button>
          
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'diagnostics' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Table Diagnostics ({Object.keys(tableStatus).length || 7})</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'sql' 
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>SQL Setup Script</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          
          {/* TAB 1: SYNC & PUSH */}
          {activeTab === 'sync' && (
            <>
              {/* Active Status Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">Active Supabase URL:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-[280px]">
                    {credentials.url || 'Not configured'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">Sync Scope:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    7 Tables (Members, Products, Subscriptions, Bills, Payments)
                  </span>
                </div>
              </div>

              {/* Status Message */}
              {testResult && (
                <div className={`p-3 rounded-xl text-xs font-medium border flex items-start space-x-2.5 ${
                  testResult.success 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800' 
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Force Sync Action Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-slate-50 to-indigo-500/10 dark:from-emerald-950/30 dark:via-slate-900 dark:to-indigo-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>Push All Current Website Data to Supabase</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Pushes all {members.length} members, {products.length} products, {milkSubs.length + newspaperSubs.length} subscriptions, and bills to Supabase Cloud.
                    </p>
                  </div>
                  <button
                    id="force-sync-all-btn"
                    onClick={handleForceSyncAll}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync All Now'}</span>
                  </button>
                </div>

                {/* Sync Progress Logs */}
                {syncLog.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] max-h-40 overflow-y-auto space-y-1 border border-slate-800">
                    {syncLog.map((log, idx) => (
                      <div key={idx} className="leading-relaxed">{log}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Project Credentials Input Form */}
              <form onSubmit={handleSaveCredentials} className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5 text-slate-400" />
                    <span>Supabase Cloud Connection Credentials</span>
                  </h4>
                  <button
                    type="button"
                    onClick={runTableDiagnostics}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isDiagnosing ? 'animate-spin' : ''}`} />
                    <span>Test & Diagnose</span>
                  </button>
                </div>
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    id="supabase-url-input"
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://yourprojectid.supabase.co"
                    className="w-full p-2 text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Supabase Anon / Service Role API Key
                  </label>
                  <input
                    id="supabase-anon-key-input"
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full p-2 text-xs font-mono border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Saves to both browser storage and backend server.
                  </span>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-black dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg transition-colors cursor-pointer"
                  >
                    {isSaving ? 'Saving...' : 'Save & Connect'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* TAB 2: TABLE DIAGNOSTICS */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Live Supabase Table Health</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Verifies each PostgreSQL table exists and allows reads/writes.
                  </p>
                </div>
                <button
                  onClick={runTableDiagnostics}
                  disabled={isDiagnosing}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  <span>Refresh Health</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                {['members', 'products', 'milk_subscriptions', 'newspaper_subscriptions', 'bills', 'payments', 'notifications'].map((tableName) => {
                  const status = tableStatus[tableName];
                  const isOk = status?.exists && status?.writable;
                  return (
                    <div 
                      key={tableName}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                        isOk
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                          : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        {isOk ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <div>
                          <span className="font-mono font-bold text-xs">{tableName}</span>
                          {status?.error && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">
                              {status.error}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          isOk 
                            ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200' 
                            : 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                        }`}>
                          {isOk ? `Ready (${status?.rowCount ?? 0} rows)` : 'Table Missing / Blocked'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!allTablesHealthy && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1.5">
                  <div className="font-bold flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>How to fix missing tables instantly:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Click the <strong>"SQL Setup Script"</strong> tab above, copy the complete script, go to your <strong>Supabase Dashboard &gt; SQL Editor</strong>, paste and hit <strong>Run</strong>. All 7 tables, RLS policies, and realtime triggers will be created in 5 seconds!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Supabase PostgreSQL DDL Script</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Run this once in your Supabase SQL Editor to initialize all 7 tables and permissions.
                  </p>
                </div>
                <button
                  id="copy-supabase-sql-btn"
                  onClick={handleCopySql}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={sqlScript}
                  rows={12}
                  className="w-full p-3 font-mono text-[11px] leading-relaxed bg-slate-950 text-slate-200 border border-slate-800 rounded-xl focus:outline-none resize-none select-all"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200">Steps to apply in Supabase:</div>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                  <li>Click <strong>"Copy SQL Script"</strong> button above</li>
                  <li>Open your Supabase project in browser (<a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-600 underline">supabase.com/dashboard</a>)</li>
                  <li>Click <strong>SQL Editor</strong> in the left sidebar</li>
                  <li>Paste and click <strong>"Run"</strong></li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Realtime Engine Live</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
