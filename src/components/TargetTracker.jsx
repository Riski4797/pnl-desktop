import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Flag, Clock } from 'lucide-react';
import { LineChart, Line, YAxis, Tooltip } from 'recharts';
import { formatMoney } from '../lib/utils';

function PaceChart({ chartData }) {
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(280);

  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.offsetWidth;
      if (w > 0) setChartWidth(w);
    }
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        if (w > 0) setChartWidth(w);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="w-full mt-3" style={{ height: 64 }}>
      <LineChart width={chartWidth} height={64} data={chartData.data}>
        <YAxis domain={['dataMin', 'dataMax']} hide />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '10px', color: '#fff', padding: '4px 8px' }}
          itemStyle={{ padding: 0 }}
          labelStyle={{ display: 'none' }}
          formatter={(value, name) => [formatMoney(value), name === 'ideal' ? 'Pace Ideal' : 'Aktual']}
        />
        <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeWidth={2} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="actual" stroke={chartData.isPaceHealthy ? '#10b981' : '#f59e0b'} strokeWidth={3} dot={false} />
      </LineChart>
    </div>
  );
}

export default function TargetTracker({ goal, setGoal, goalProgress, entries = [] }) {
  
  // Calculate pace chart data
  const chartData = useMemo(() => {
     if (!goal.startDate || !goal.deadline) return { data: [], isPaceHealthy: true, latestIdeal: 0, latestActual: 0 };
     
     // Robust parsing to local timezone noon to prevent UTC drift
     const sParts = goal.startDate.split('-');
     const start = new Date(sParts[0], sParts[1]-1, sParts[2], 12, 0, 0);

     const eParts = goal.deadline.split('-');
     const end = new Date(eParts[0], eParts[1]-1, eParts[2], 12, 0, 0);
     
     if (start >= end) return { data: [], isPaceHealthy: true, latestIdeal: 0, latestActual: 0 };

     // Limit to max 10 years to prevent infinite loop memory crashes
     let totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
     if (totalDays > 3650) totalDays = 3650;
     
     // Compound growth rate (synced with TopBar dailyRate formula)
      const startingCapital = goal.startingCapital || 1000;
      const targetEquity = startingCapital + goal.target;
      const dailyCompoundRate = Math.pow(targetEquity / startingCapital, 1 / totalDays) - 1;

     // Sort entries chronological
     const sortedEntries = [...entries].sort((a,b) => new Date(a.date) - new Date(b.date));
     
     const pnlByDate = {};
     sortedEntries.forEach(e => {
         let dKey = '';
         if (e.date.includes('T')) {
             dKey = e.date.split('T')[0];
         } else {
             dKey = e.date; // fallback if already YYYY-MM-DD
         }
         
         // Only log trades that happen ON or AFTER the start date string directly
         if (dKey >= goal.startDate && dKey <= goal.deadline) {
             if (!pnlByDate[dKey]) pnlByDate[dKey] = 0;
             pnlByDate[dKey] += e.pnl;
         }
     });

     const today = new Date();
     today.setHours(23,59,59,999);

     const data = [];
     let currentCumPnL = 0;
     let isPaceHealthy = true;
     let latestActual = 0;
     let latestIdeal = 0;

     for (let i = 0; i <= totalDays; i++) {
        // Iterate at noon to ensure stable day steps
        const currentDate = new Date(start.getTime() + i * 86400000); 
        
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // Compound ideal: PnL needed by day i = capital * ((1+r)^i - 1)
         const idealVal = startingCapital * (Math.pow(1 + dailyCompoundRate, i) - 1);
        
        let actualVal = null;
        if (currentDate <= today) {
            if (pnlByDate[dateStr] !== undefined) currentCumPnL += pnlByDate[dateStr];
            actualVal = currentCumPnL;
            latestActual = actualVal;
            latestIdeal = idealVal;
        }

        data.push({
            name: dateStr,
            ideal: idealVal,
            actual: actualVal
        });
     }
     
     isPaceHealthy = latestActual >= latestIdeal;

     return { data, isPaceHealthy, latestIdeal, latestActual };
  }, [goal, entries]);

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-300">
      <h3 className="text-slate-800 dark:text-slate-200 font-semibold mb-4 flex items-center justify-between">
        <span className="flex items-center"><Flag className="w-4 h-4 mr-2 text-amber-500 dark:text-yellow-500" /> Target Tracker</span>
        {chartData.data && chartData.data.length > 0 && !goalProgress.isReached && !goalProgress.isExpired && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${chartData.isPaceHealthy ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                {chartData.isPaceHealthy ? 'ON TARGET 🚀' : 'BEHIND PACE ⚠️'}
            </span>
        )}
      </h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">Modal Awal</label>
            <input type="number" value={goal.startingCapital} onChange={(e) => setGoal(prev => ({...prev, startingCapital: Number(e.target.value)}))}
              className="w-full bg-slate-50 dark:bg-[#0a0e17] border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">Target Net PnL</label>
            <input type="number" value={goal.target} onChange={(e) => setGoal(prev => ({...prev, target: Number(e.target.value)}))}
              className="w-full bg-amber-50 dark:bg-yellow-500/5 border border-amber-200 dark:border-yellow-500/20 rounded-lg p-2 text-sm text-amber-700 dark:text-yellow-400 font-bold focus:outline-none focus:border-yellow-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">Mulai</label>
            <input type="date" value={goal.startDate || ''} onChange={(e) => setGoal(prev => ({...prev, startDate: e.target.value}))}
              className="w-full bg-slate-50 dark:bg-[#0a0e17] border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-500 mb-1">Batas Waktu</label>
            <input type="date" value={goal.deadline} onChange={(e) => setGoal(prev => ({...prev, deadline: e.target.value}))}
              className="w-full bg-slate-50 dark:bg-[#0a0e17] border border-slate-300 dark:border-slate-800 rounded-lg p-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500/50" />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500 dark:text-slate-400">Progress PnL Aktual</span>
            <span className="text-amber-600 dark:text-yellow-400 font-bold">{goalProgress.progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-1">
            <div className={`h-2 rounded-full transition-all duration-500 ${goalProgress.isReached ? 'bg-emerald-500' : 'bg-amber-500 dark:bg-yellow-500'}`} style={{ width: `${goalProgress.progressPercent}%` }}></div>
          </div>
          
          {/* Sparkline Pace Chart */}
          {chartData.data && chartData.data.length > 0 && (
              <PaceChart chartData={chartData} />
          )}
        </div>

        <div className="bg-slate-50 dark:bg-[#0a0e17] rounded-lg p-3 border border-slate-200 dark:border-slate-800/50 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400 flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5"/> Sisa Waktu:</span>
            <span className={`font-medium ${goalProgress.isExpired ? 'text-rose-500 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
              {goalProgress.isReached ? 'Tercapai! 🎉' : goalProgress.isExpired ? 'Waktu Habis' : `${goalProgress.daysRemaining} Hari`}
            </span>
          </div>
          {!goalProgress.isReached && !goalProgress.isExpired && (
            <>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200 dark:border-slate-800/50">
                <span className="text-slate-500 dark:text-slate-400">Target Harian (Ekspektasi):</span>
                <div className="text-right">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold block">+{goalProgress.dailyRate.toFixed(2)}% /hari</span>
                  <span className="text-[10px] text-slate-500 block">(~{formatMoney(goalProgress.nextDayTargetAmt)})</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] mt-1 text-slate-500 dark:text-slate-400">
                  <span>Defisit vs Garis Ideal:</span>
                  <span className={chartData.isPaceHealthy ? "text-emerald-500" : "text-rose-500"}>
                      {chartData.latestActual >= chartData.latestIdeal ? '+' : ''}{formatMoney(chartData.latestActual - chartData.latestIdeal)}
                  </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
