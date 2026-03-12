import React, { useState, useEffect } from 'react';
import { X, Save, Edit, Calendar, Tag, TrendingUp, DollarSign, FileText, Star } from 'lucide-react';
import { formatMoney } from '../lib/utils';

export default function TradeDrawer({ trade, isOpen, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (trade) {
      setFormData({ ...trade });
      setIsEditing(false);
    }
  }, [trade, isOpen]);

  if (!isOpen || !trade) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const updatedTrade = { 
      ...formData, 
      pnl: parseFloat(formData.pnl) || 0 
    };
    onUpdate(updatedTrade);
    setIsEditing(false);
  };

  const handleToggleFavorite = () => {
    onUpdate({ ...trade, isFavorite: !trade.isFavorite });
  };

  const isProfit = trade.pnl >= 0;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[450px] bg-white dark:bg-[#111827] border-l border-slate-200 dark:border-slate-700/60 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-[#0d131f]">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
            {isEditing ? 'Edit Trade' : 'Trade Details'}
            {!isEditing && (
              <span className={`ml-3 px-2 py-0.5 rounded text-xs shrink-0 ${isProfit ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'}`}>
                {isProfit ? 'PROFIT' : 'LOSS'}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button onClick={handleToggleFavorite} className={`p-1.5 rounded transition-colors ${trade.isFavorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20' : 'text-slate-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800'} border border-transparent ${trade.isFavorite ? 'border-amber-500/20' : ''}`} title={trade.isFavorite ? 'Hapus dari Playbook' : 'Jadikan Playbook'}>
                  <Star className={`w-4 h-4 ${trade.isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors" title="Edit Jurnal">
                  <Edit className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(false)} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-xs font-semibold px-3">
                Batal
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isEditing ? (
            // VIEW MODE
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                  <div className="text-slate-600 dark:text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Asset & Posisi</div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {trade.asset.toUpperCase()} 
                    <span className={`text-base px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 ${trade.type === 'Long' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {trade.type}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-600 dark:text-slate-500 text-xs font-medium uppercase tracking-wider mb-1">Net PnL</div>
                  <div className={`text-2xl font-bold ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {isProfit ? '+' : ''}{formatMoney(trade.pnl)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-[#0a0e17] p-4 rounded-lg border border-slate-200 dark:border-slate-800/60">
                  <div className="flex items-center text-slate-500 dark:text-slate-400 mb-1">
                    <Calendar className="w-4 h-4 mr-1.5" /> <span className="text-xs font-medium">Tanggal</span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 font-semibold">{new Date(trade.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div className="bg-slate-50 dark:bg-[#0a0e17] p-4 rounded-lg border border-slate-200 dark:border-slate-800/60">
                  <div className="flex items-center text-slate-500 dark:text-slate-400 mb-1">
                    <Tag className="w-4 h-4 mr-1.5" /> <span className="text-xs font-medium">Strategi Tag</span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 font-semibold">{trade.tag || <span className="text-slate-400 dark:text-slate-600 italic">Tanpa Tag</span>}</div>
                </div>
              </div>

              {trade.notes && (
                <div className="bg-slate-50 dark:bg-[#0a0e17] p-4 rounded-lg border border-slate-200 dark:border-slate-800/60">
                  <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2">
                    <FileText className="w-4 h-4 mr-1.5" /> <span className="text-xs font-medium">Catatan / Evaluasi</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
                </div>
              )}
            </div>
          ) : (
            // EDIT MODE
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tanggal & Waktu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input type="datetime-local" name="date" value={formData.date} onChange={handleChange} required
                    className="w-full pl-9 bg-slate-50 dark:bg-[#0a0e17] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Aset</label>
                  <input type="text" name="asset" value={formData.asset} onChange={handleChange} required
                    className="w-full bg-slate-50 dark:bg-[#0a0e17] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 uppercase focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Posisi</label>
                  <div className="flex bg-slate-50 dark:bg-[#0a0e17] p-1 rounded-lg border border-slate-300 dark:border-slate-800 w-full h-[42px]">
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
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Net PnL ($)</label>
                  <input type="number" step="0.01" name="pnl" value={formData.pnl} onChange={handleChange} required
                    className="w-full bg-slate-50 dark:bg-[#0a0e17] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tag Strategi</label>
                  <input type="text" name="tag" value={formData.tag || ''} onChange={handleChange}
                    className="w-full bg-slate-50 dark:bg-[#0a0e17] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Catatan</label>
                <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows="4"
                  className="w-full bg-slate-50 dark:bg-[#0a0e17] border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-y" />
              </div>
              
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button onClick={handleSave} className="w-full flex items-center justify-center py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-colors">
                  <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
