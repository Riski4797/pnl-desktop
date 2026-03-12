import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { formatMoney } from '../lib/utils';

function ResponsiveBarChart({ data }) {
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(400);

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
    <div ref={containerRef} className="w-full" style={{ height: 180 }}>
      <BarChart width={chartWidth} height={180} data={data}>
        <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94a3b8" />
        <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" hide />
        <Tooltip
          contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '11px', color: '#fff', padding: '6px 10px' }}
          formatter={(value, name) => [formatMoney(value), name === 'pnl' ? 'Net PnL' : name]}
          labelFormatter={(label) => `Jam ${label}:00`}
        />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
          ))}
        </Bar>
      </BarChart>
    </div>
  );
}

export default function TimeAnalysisChart({ entries }) {
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: String(i).padStart(2, '0'),
      pnl: 0,
      trades: 0,
      wins: 0
    }));

    entries.forEach(e => {
      if (!e.date) return;
      let h = 0;
      if (e.date.includes('T')) {
        const timePart = e.date.split('T')[1];
        if (timePart) h = parseInt(timePart.split(':')[0], 10);
      } else if (e.date.includes(' ')) {
        const timePart = e.date.split(' ')[1];
        if (timePart) h = parseInt(timePart.split(':')[0], 10);
      }
      if (h >= 0 && h < 24) {
        hours[h].pnl += e.pnl;
        hours[h].trades += 1;
        if (e.pnl > 0) hours[h].wins += 1;
      }
    });

    return hours.filter(h => h.trades > 0);
  }, [entries]);

  const bestHour = useMemo(() => {
    if (hourlyData.length === 0) return null;
    return [...hourlyData].sort((a, b) => b.pnl - a.pnl)[0];
  }, [hourlyData]);

  const worstHour = useMemo(() => {
    if (hourlyData.length === 0) return null;
    return [...hourlyData].sort((a, b) => a.pnl - b.pnl)[0];
  }, [hourlyData]);

  if (hourlyData.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 shadow-sm dark:shadow-none transition-colors duration-300">
      <h3 className="text-slate-800 dark:text-slate-200 font-semibold mb-4 flex items-center">
        <Clock className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" /> Analisis Waktu Trading
      </h3>

      <ResponsiveBarChart data={hourlyData} />

      <div className="grid grid-cols-2 gap-3 mt-4">
        {bestHour && (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-3 text-center">
            <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Jam Terbaik</div>
            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{bestHour.hour}:00</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400">{formatMoney(bestHour.pnl)} ({bestHour.trades} trades)</div>
          </div>
        )}
        {worstHour && worstHour.pnl < 0 && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg p-3 text-center">
            <div className="text-[10px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Jam Terburuk</div>
            <div className="text-lg font-bold text-rose-700 dark:text-rose-300">{worstHour.hour}:00</div>
            <div className="text-[10px] text-rose-600 dark:text-rose-400">{formatMoney(worstHour.pnl)} ({worstHour.trades} trades)</div>
          </div>
        )}
      </div>
    </div>
  );
}
