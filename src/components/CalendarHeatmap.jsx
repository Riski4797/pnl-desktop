import React from 'react';
import { CalendarDays } from 'lucide-react';
import { formatMoney } from '../lib/utils';

export default function CalendarHeatmap({ calendarDays, currentMonth, setCurrentMonth, dailyLogs, onDayClick, onJournalClick, selectedDate }) {
  const isSelected = (day) => day && selectedDate && day.dateStr === selectedDate;
  return (
    <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 h-full flex flex-col justify-between shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-800 dark:text-slate-200 font-semibold flex items-center">
          <CalendarDays className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" /> Heatmap
        </h3>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {currentMonth.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, i) => (
          <div key={i} className="text-slate-600 dark:text-slate-500 text-[10px] font-bold">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1.5 md:gap-2">
        {calendarDays.map((day, idx) => {
          let bgClass = "bg-slate-50 dark:bg-[#0a0e17] border border-slate-200 dark:border-slate-800/40 text-slate-600 dark:text-slate-500";
          if (day && day.pnl !== undefined) {
            if (day.pnl > 0) bgClass = "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30";
            else if (day.pnl < 0) bgClass = "bg-rose-100 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/30";
            else bgClass = "bg-slate-200 dark:bg-slate-700/30 border-slate-300 dark:border-slate-600/50 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700/50";
          }

          return (
            <div key={idx} 
              className={`relative min-h-[60px] sm:min-h-[75px] rounded-lg flex flex-col items-center justify-center transition-all ${!day ? 'invisible' : bgClass} ${day ? 'cursor-pointer' : ''} ${isSelected(day) ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-md scale-[1.03]' : 'ring-1 ring-transparent hover:ring-slate-400/50'}`}
              title={day && day.pnl !== undefined ? `${day.dateStr}: ${day.pnl > 0 ? '+' : ''}${formatMoney(day.pnl)} (${day.percent > 0 ? '+' : ''}${day.percent.toFixed(2)}%)` : ''}
              onClick={() => {
                if (day && day.dateStr && onDayClick) {
                  onDayClick(day.dateStr);
                }
              }}
            >
              {day && (
                <>
                  <span className="absolute top-1 right-1.5 text-[10px] font-bold opacity-50">{day.day}</span>
                  {dailyLogs && dailyLogs[day.dateStr] && (
                    (typeof dailyLogs[day.dateStr] === 'string' && dailyLogs[day.dateStr].trim() !== '') ||
                    (typeof dailyLogs[day.dateStr] === 'object' && (dailyLogs[day.dateStr].notes?.trim() !== '' || dailyLogs[day.dateStr].rating > 0 || dailyLogs[day.dateStr].mood || dailyLogs[day.dateStr].tags?.length > 0))
                  ) && (
                    <span className="absolute top-1 left-1 sm:left-1.5 text-[10px] cursor-pointer hover:scale-125 transition-transform" title="Buka Jurnal"
                      onClick={(e) => { e.stopPropagation(); if (onJournalClick) onJournalClick(day.dateStr); }}
                    >📝</span>
                  )}
                  {day.pnl !== undefined && (
                    <div className="flex flex-col items-center mt-2 px-1 text-center w-full">
                      <span className="text-[10px] sm:text-xs font-bold truncate w-full">{day.pnl > 0 ? '+' : ''}${formatMoney(Math.abs(day.pnl)).replace('$', '')}</span>
                      <span className="text-[9px] font-medium opacity-80 truncate w-full">{day.percent > 0 ? '+' : ''}{day.percent.toFixed(2)}%</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex justify-between gap-2">
         <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="flex-1 py-1.5 bg-slate-50 dark:bg-[#0a0e17] hover:bg-slate-200 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 rounded border border-slate-300 dark:border-slate-800 transition-colors">Bulan Lalu</button>
         {selectedDate && (
           <button onClick={() => onDayClick(selectedDate)} className="flex-1 py-1.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-xs text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-500/30 transition-colors font-medium">✕ Reset Filter</button>
         )}
         <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="flex-1 py-1.5 bg-slate-50 dark:bg-[#0a0e17] hover:bg-slate-200 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 rounded border border-slate-300 dark:border-slate-800 transition-colors">Bulan Depan</button>
      </div>
    </div>
  );
}
