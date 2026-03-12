import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Key, ShieldAlert } from 'lucide-react';

export default function GateIoSyncModal({ onClose, onSyncSuccess }) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load saved keys on mount
    const loadKeys = async () => {
      try {
        if (window.electronAPI) {
          const savedKey = await window.electronAPI.storeGet('gateio_api_key');
          const savedSecret = await window.electronAPI.storeGet('gateio_api_secret');
          if (savedKey) setApiKey(savedKey);
          if (savedSecret) setApiSecret(savedSecret);
        }
      } catch (err) {
        console.error("Failed to load saved Gate.io keys", err);
      }
    };
    loadKeys();
  }, []);

  const handleSync = async () => {
    if (!apiKey || !apiSecret) {
      setError("API Key dan Secret Key harus diisi.");
      return;
    }

    if (!window.electronAPI || !window.electronAPI.syncGateIo) {
      setError("Fitur ini hanya tersedia di Desktop App.");
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      // Save keys for next time
      await window.electronAPI.storeSet('gateio_api_key', apiKey);
      await window.electronAPI.storeSet('gateio_api_secret', apiSecret);

      // sync data from past 30 days
      const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);

      const response = await window.electronAPI.syncGateIo(apiKey, apiSecret, thirtyDaysAgo.toString(), null);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      if (response.data && response.data.length > 0) {
        onSyncSuccess(response.data);
      } else {
        setError("Tidak ada data transaksi (0 trades) ditemukan dalam 30 hari terakhir.");
      }

    } catch (err) {
      setError(err.message || "Gagal menghubungi server Gate.io");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/60 rounded-xl w-full max-w-md overflow-hidden relative shadow-2xl transition-colors duration-300">
        <div className="flex bg-slate-50 dark:bg-[#0d131f] justify-between items-center px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 transition-colors">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <RefreshCw className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Gate.io Auto-Sync
          </h3>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white" disabled={isSyncing}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-3 rounded-lg flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800 dark:text-blue-200/80 leading-relaxed">
              Kunci Anda hanya disimpan secara **lokal** berkat enkripsi Electron. Sangat disarankan untuk hanya menggunakan API Key dengan izin <strong>Read-Only (Hanya Baca)</strong> demi keamanan ganda.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">API Key</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a0e17] pl-9 pr-3 py-2 text-sm text-slate-800 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 focus:outline-none placeholder-slate-400 dark:placeholder-slate-600"
                placeholder="Gate.io API Key v4"
                disabled={isSyncing}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">API Secret</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input 
                type="password" 
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0a0e17] pl-9 pr-3 py-2 text-sm text-slate-800 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 focus:outline-none placeholder-slate-400 dark:placeholder-slate-600"
                placeholder="Gate.io API Secret v4"
                disabled={isSyncing}
              />
            </div>
          </div>

          {error && (
            <div className="text-rose-400 text-xs font-medium bg-rose-500/10 p-2 rounded border border-rose-500/20">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className={`w-full flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isSyncing 
                  ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Menyinkronkan...
                </>
              ) : (
                'Sync 30 Hari Terakhir'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
