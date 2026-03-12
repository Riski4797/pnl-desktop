import React, { useState } from 'react';
import { Trash2, Tag, Image as ImageIcon } from 'lucide-react';
import { formatMoney } from '../lib/utils';
import TradeDrawer from './TradeDrawer';

export default function TradeHistory({ entries, deleteEntry, updateEntry }) {
  const [selectedTrade, setSelectedTrade] = useState(null);

  return (
    <>
      <div className="lg:col-span-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-0 overflow-hidden flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800/60 flex justify-between items-center bg-white dark:bg-[#111827]">
        <h3 className="text-slate-800 dark:text-slate-200 font-semibold">Riwayat Transaksi</h3>
        <span className="text-xs text-slate-600 dark:text-slate-500 bg-slate-50 dark:bg-[#0a0e17] px-2 py-1 rounded-md border border-slate-300 dark:border-slate-800">{entries.length} Trades Ditampilkan</span>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-[#0a0e17] border-b border-slate-200 dark:border-slate-800/50">
            <tr className="text-slate-600 dark:text-slate-500 text-xs uppercase tracking-wider">
              <th className="py-3 px-4 font-medium">Tanggal</th>
              <th className="py-3 px-4 font-medium">Aset</th>
              <th className="py-3 px-4 font-medium">Posisi</th>
              <th className="py-3 px-4 font-medium">Strategi Tag</th>
              <th className="py-3 px-4 font-medium">Catatan</th>
              <th className="py-3 px-4 font-medium text-right">Net PnL</th>
              <th className="py-3 px-4 font-medium text-center w-12"></th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200 dark:divide-slate-800/50">
            {entries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => (
              <tr 
                key={entry.id} 
                onClick={() => setSelectedTrade(entry)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer"
              >
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                  <span className="block">{entry.date.substring(5, 10).replace('-', '/')}</span>
                  {entry.date.includes('T') && <span className="text-[10px] text-slate-400 dark:text-slate-500">{entry.date.substring(11, 16)}</span>}
                </td>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-200">{entry.asset.toUpperCase()}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${entry.type === 'Long' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                    {entry.type}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {entry.tag ? (
                    <span className="flex items-center text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/50 max-w-[120px] truncate" title={entry.tag}>
                      <Tag className="w-3 h-3 mr-1 opacity-70" /> {entry.tag}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-600 text-[10px] italic">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-500 max-w-[120px]">
                  <div className="flex items-center gap-2">
                    <span className="truncate" title={entry.notes}>{entry.notes || '-'}</span>
                    {entry.imagePath && (
                      <ImageIcon className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" title="Ada Screenshot" />
                    )}
                  </div>
                </td>
                <td className={`py-3 px-4 text-right font-bold ${entry.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {entry.pnl >= 0 ? '+' : ''}{formatMoney(entry.pnl)}
                </td>
                <td className="py-3 px-4 text-center">
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }} 
                    className="text-slate-400 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all" 
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-500">Tidak ada data yang sesuai filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Trade Detail Drawer */}
    <TradeDrawer 
      trade={selectedTrade} 
      isOpen={!!selectedTrade} 
      onClose={() => setSelectedTrade(null)} 
      onUpdate={(updatedData) => {
        updateEntry(updatedData);
        setSelectedTrade(updatedData); // keep drawer open with new data
      }}
    />
    </>
  );
}
