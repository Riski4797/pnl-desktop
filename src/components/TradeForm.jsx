import React, { useState, useEffect } from 'react';
import { PlusCircle, Calendar, Camera, X } from 'lucide-react';

export default function TradeForm({ onAddEntry, lastDate }) {
  // Helper to format Date object locally (YYYY-MM-DDTHH:mm) for datetime-local
  const getLocalIsoString = (d) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    date: lastDate ? getLocalIsoString(new Date(lastDate)) : getLocalIsoString(new Date()),
    asset: '',
    type: 'Long',
    pnl: '',
    tag: '',
    notes: '',
    screenshot: ''
  });

  // Listen for changes in lastDate from props to implement sticky dates across sessions
  useEffect(() => {
    if (lastDate && formData.date === getLocalIsoString(new Date())) {
      setFormData(prev => ({ ...prev, date: getLocalIsoString(new Date(lastDate)) }));
    }
  }, [lastDate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.asset || formData.pnl === '') return;

    const newEntry = {
      ...formData,
      id: Date.now().toString(),
      pnl: parseFloat(formData.pnl)
    };

    onAddEntry(newEntry);
    
    // Reset form but keep the last date (sticky date)
    setFormData(prev => ({ 
      ...prev, 
      asset: '', 
      pnl: '', 
      tag: '', 
      notes: '',
      screenshot: ''
    }));
  };

  const setDateShortcut = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    setFormData(prev => ({ ...prev, date: getLocalIsoString(d) }));
  };

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-300">
      <h3 className="text-slate-800 dark:text-slate-200 font-semibold mb-4 flex items-center">
        <PlusCircle className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" /> Jurnal Baru
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-500">Tanggal & Waktu</label>
            <div className="flex space-x-1">
              <button type="button" onClick={() => setDateShortcut(-1)} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-[#1a2332] text-slate-500 dark:text-slate-400 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Kemarin</button>
              <button type="button" onClick={() => setDateShortcut(0)} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-[#1a2332] text-slate-500 dark:text-slate-400 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">Hari Ini</button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <input type="datetime-local" name="date" value={formData.date} onChange={handleInputChange} required
              className="w-full pl-9 bg-slate-50 dark:bg-[#0a0e17] border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">Aset</label>
            <input type="text" name="asset" value={formData.asset} onChange={handleInputChange} placeholder="BTC" required
              className="w-full bg-slate-50 dark:bg-[#0a0e17] border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-800 dark:text-slate-200 uppercase placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">Posisi</label>
            <div className="flex bg-slate-50 dark:bg-[#0a0e17] p-1 rounded-lg border border-slate-300 dark:border-slate-800 w-full h-[38px]">
              <button 
                type="button"
                onClick={() => setFormData(p => ({...p, type: 'Long'}))}
                className={`flex-1 text-xs font-semibold rounded-md transition-all duration-200 ${
                  formData.type === 'Long' 
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
                }`}
              >
                Long
              </button>
              <button 
                type="button"
                onClick={() => setFormData(p => ({...p, type: 'Short'}))}
                className={`flex-1 text-xs font-semibold rounded-md transition-all duration-200 ${
                  formData.type === 'Short' 
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-300/50 dark:hover:bg-slate-800/50'
                }`}
              >
                Short
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">Net PnL ($)</label>
            <input type="number" step="0.01" name="pnl" value={formData.pnl} onChange={handleInputChange} placeholder="-50.00" required
              className="w-full bg-slate-50 dark:bg-[#0a0e17] border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">Tag Strategi (Opsional)</label>
            <input type="text" name="tag" value={formData.tag} onChange={handleInputChange} placeholder="Breakout"
              className="w-full bg-slate-50 dark:bg-[#0a0e17] border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" />
          </div>
        </div>

        {/* Screenshot Attachment */}
        <div>
          {formData.screenshot ? (
            <div className="relative inline-block">
              <img 
                src={window.electronAPI ? `local://${formData.screenshot}` : formData.screenshot} 
                alt="Screenshot" 
                className="h-16 rounded-lg border border-slate-300 dark:border-slate-700 object-cover"
              />
              <button type="button" onClick={() => setFormData(p => ({...p, screenshot: ''}))} 
                className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 hover:bg-rose-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={async () => {
              if (window.electronAPI?.selectTradeScreenshot) {
                const path = await window.electronAPI.selectTradeScreenshot();
                if (path) setFormData(p => ({...p, screenshot: path}));
              } else {
                alert('Fitur ini hanya tersedia di mode Desktop (Electron).');
              }
            }} className="w-full py-1.5 bg-slate-50 dark:bg-[#0a0e17] hover:bg-slate-200 dark:hover:bg-slate-800 text-xs text-slate-500 dark:text-slate-400 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Lampirkan Screenshot
            </button>
          )}
        </div>

        <button type="submit" className="w-full mt-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-sm font-semibold py-2 rounded-lg transition-colors">
          Simpan Trade
        </button>
      </form>
    </div>
  );
}
