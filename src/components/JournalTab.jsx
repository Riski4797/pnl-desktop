import React, { useState, useMemo, useEffect } from 'react';
import { PenTool, Calendar, Save, CheckCircle2, Star, Tag } from 'lucide-react';
import { getDateOnly, formatMoney } from '../lib/utils';

const MOODS = [
  { emoji: '🤩', label: 'Sangat Disiplin / Sabar' },
  { emoji: '😊', label: 'Tenang' },
  { emoji: '😐', label: 'Biasa Saja' },
  { emoji: '😡', label: 'Emosi / FOMO' },
  { emoji: '😭', label: 'Frustrasi / Ragu' },
];

const PRESET_TAGS = [
  'Perfect Setup', 'Overtrading', 'Revenge Trading', 'Hesitation', 'FOMO', 'Cut Loss Kecepatan', 'Pegang Floating'
];

export default function JournalTab({ entries, dailyLogs, setDailyLogs, initialDate }) {
  const [selectedDate, setSelectedDate] = useState(initialDate || getDateOnly(new Date().toISOString()));
  const [currentNote, setCurrentNote] = useState('');
  const [currentRating, setCurrentRating] = useState(0);
  const [currentMood, setCurrentMood] = useState(null);
  const [currentTags, setCurrentTags] = useState([]);

  const [isSaved, setIsSaved] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  // ONLY sync when selectedDate changes (not when dailyLogs changes, otherwise it loops when typing)
  useEffect(() => {
    const data = dailyLogs[selectedDate];
    if (typeof data === 'string') {
      setCurrentNote(data);
      setCurrentRating(0);
      setCurrentMood(null);
      setCurrentTags([]);
    } else if (data) {
      setCurrentNote(data.notes || '');
      setCurrentRating(data.rating || 0);
      setCurrentMood(data.mood || null);
      setCurrentTags(data.tags || []);
    } else {
      setCurrentNote('');
      setCurrentRating(0);
      setCurrentMood(null);
      setCurrentTags([]);
    }
    setIsSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]); // Explicitly omitted `dailyLogs` to prevent overriding on every keystroke

  // Real-time local state bound to UI changes, saved explicitly via handleSave
  const handleSave = () => {
    setDailyLogs(prev => ({
      ...prev,
      [selectedDate]: {
        notes: currentNote,
        rating: currentRating,
        mood: currentMood,
        tags: currentTags
      }
    }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleTag = (tag) => {
    if (currentTags.includes(tag)) {
      setCurrentTags(currentTags.filter(t => t !== tag));
    } else {
      setCurrentTags([...currentTags, tag]);
    }
  };

  // CALENDAR LOGIC (Similar to Heatmap but simpler grid)
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const dailyDataSummary = useMemo(() => {
    const grouped = entries.reduce((acc, entry) => {
      const d = getDateOnly(entry.date);
      acc[d] = (acc[d] || 0) + entry.pnl;
      return acc;
    }, {});
    return grouped;
  }, [entries]);

  const calendarDays = useMemo(() => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Empty prefix slots
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const logData = dailyLogs[dateString];
      let hasContent = false;
      if (typeof logData === 'string') hasContent = logData.trim().length > 0;
      else if (logData) hasContent = !!(logData.notes?.trim().length > 0 || logData.rating > 0 || logData.mood || logData.tags?.length > 0);

      days.push({
        date: dateString,
        day: i,
        pnl: dailyDataSummary[dateString] || 0,
        hasLog: hasContent
      });
    }
    return days;
  }, [currentMonth, firstDayOfMonth, daysInMonth, dailyDataSummary, dailyLogs]);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  // STATS OF THE SELECTED DAY
  const selectedDayTrades = entries.filter(e => getDateOnly(e.date) === selectedDate);
  const selectedDayPnL = selectedDayTrades.reduce((sum, e) => sum + e.pnl, 0);
  const selectedDayWinRate = selectedDayTrades.length > 0 
    ? (selectedDayTrades.filter(e => e.pnl > 0).length / selectedDayTrades.length) * 100 
    : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px]">
      
      {/* LEFT: Calendar Sidebar */}
      <div className="w-full lg:w-80 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 shadow-sm flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" /> Kalender
          </h2>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400">&larr;</button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[100px] text-center">
              {currentMonth.toLocaleString('id-ID', { month: 'short', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400">&rarr;</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={i} className="aspect-square"></div>;
            
            const isSelected = day.date === selectedDate;
            const isToday = day.date === getDateOnly(new Date().toISOString());
            
            // Color coding based on PnL
            let bgColor = "bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700";
            if (day.pnl > 0) bgColor = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
            if (day.pnl < 0) bgColor = "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400";
            
            if (isSelected) bgColor = "bg-blue-500 text-white shadow-md ring-2 ring-blue-500/50 ring-offset-2 dark:ring-offset-[#111827] ring-offset-white";

            return (
              <button 
                key={i} 
                onClick={() => setSelectedDate(day.date)}
                className={`relative aspect-square rounded-md flex flex-col items-center justify-center text-xs font-medium transition-all duration-200 ${bgColor}`}
              >
                <span className={isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}>{day.day}</span>
                {isToday && !isSelected && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500"></div>}
                {day.hasLog && <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`}></div>}
              </button>
            );
          })}
        </div>
        
        <div className="mt-8 space-y-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Hari Ini</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Ada Catatan</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-md bg-emerald-500/30"></div> Profit</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-md bg-rose-500/30"></div> Loss</div>
        </div>
      </div>

      {/* RIGHT: Editor Area */}
      <div className="flex-1 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-0 shadow-sm flex flex-col overflow-hidden">
        {/* Editor Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-amber-500" />
              Jurnal: {new Date(selectedDate).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Catat emosi, evaluasi strategi, dan pelajaran hari ini.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trades</div>
              <div className="font-mono text-sm dark:text-slate-200">{selectedDayTrades.length}</div>
            </div>
            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Win Rate</div>
              <div className="font-mono text-sm dark:text-slate-200">{selectedDayWinRate.toFixed(0)}%</div>
            </div>
            <div className="text-center px-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Net PnL</div>
              <div className={`font-mono text-sm font-bold ${selectedDayPnL > 0 ? 'text-emerald-500' : selectedDayPnL < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                {selectedDayPnL > 0 ? '+' : ''}{formatMoney(selectedDayPnL)}
              </div>
            </div>
          </div>
        </div>

        {/* Psychological Toolkit Bar */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex flex-col xl:flex-row xl:items-center gap-4 xl:gap-8 overflow-x-auto">
          
          {/* Execution Rating */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Execution:</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setCurrentRating(star)}
                  className={`p-1 hover:scale-110 transition-transform ${currentRating >= star ? 'text-amber-400 dark:text-amber-500' : 'text-slate-200 dark:text-slate-700/50'}`}
                >
                  <Star className={`w-5 h-5 ${currentRating >= star ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="hidden xl:block w-px h-8 bg-slate-200 dark:bg-slate-700"></div>

          {/* Mood Tracker */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">Mood:</span>
            <div className="flex bg-slate-100 dark:bg-[#0a0e17] rounded-full p-1 border border-slate-200 dark:border-slate-800">
              {MOODS.map(m => (
                <button
                  key={m.emoji}
                  onClick={() => setCurrentMood(m.emoji)}
                  title={m.label}
                  className={`text-lg px-2 py-0.5 rounded-full transition-all duration-200 ${currentMood === m.emoji ? 'bg-white dark:bg-slate-800 shadow scale-110 ring-1 ring-slate-200 dark:ring-slate-700' : 'opacity-40 hover:opacity-100 grayscale hover:grayscale-0'}`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Mistake & Success Tags */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0a0e17] flex flex-wrap items-center gap-2">
           <Tag className="w-4 h-4 text-slate-400 mr-1" />
           {PRESET_TAGS.map(tag => {
             const isActive = currentTags.includes(tag);
             const isSuccess = tag.includes('Perfect');
             
             let colorClasses = "bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500";
             if (isActive) {
               if (isSuccess) colorClasses = "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/50 font-medium";
               else colorClasses = "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/50 font-medium";
             }

             return (
               <button 
                 key={tag}
                 onClick={() => toggleTag(tag)}
                 className={`text-xs px-3 py-1.5 rounded-full transition-colors ${colorClasses}`}
               >
                 {tag}
               </button>
             );
           })}
        </div>

        {/* Text Area */}
        <div className="flex-1 p-5 relative bg-white dark:bg-[#0a0e17]">
          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Bagaimana kondisi psikologis Anda hari ini? Apakah Anda mengikuti trading plan dengan disiplin? Apa yang bisa diperbaiki besok?"
            className="w-full h-full resize-none bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none leading-relaxed text-base"
          />
        </div>

        {/* Editor Footer / Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end items-center">
           {isSaved && (
             <span className="text-emerald-500 dark:text-emerald-400 text-sm font-medium flex items-center mr-4 animate-in fade-in slide-in-from-right-4">
               <CheckCircle2 className="w-4 h-4 mr-1.5" /> Tersimpan
             </span>
           )}
           <button 
             onClick={handleSave}
             className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center transition-colors shadow-sm"
           >
             <Save className="w-4 h-4 mr-2" /> Simpan Jurnal
           </button>
        </div>
      </div>

    </div>
  );
}
