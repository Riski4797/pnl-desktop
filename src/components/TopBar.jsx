import React, { useMemo } from 'react';
import { Wallet, Target } from 'lucide-react';
import { formatMoney, getDateOnly } from '../lib/utils';

export default function TopBar({ entries, goal, goalProgress }) {
  // Extract values from settings
  const startingCapital = Number(goal?.startingCapital) || 0;
  const targetAmount = Number(goal?.target) || 100; // default 100 if none set

  // Calculate Balance: starting capital + sum of all PnL
  const totalPnL = useMemo(() => entries.reduce((sum, e) => sum + e.pnl, 0), [entries]);
  const totalBalance = startingCapital + totalPnL;

  // Calculate Daily PnL
  const dailyPnL = useMemo(() => {
    const today = getDateOnly(new Date().toISOString());
    return entries
      .filter(e => getDateOnly(e.date) === today)
      .reduce((sum, e) => sum + e.pnl, 0);
  }, [entries]);

  // Calculate Weekly PnL
  const weeklyPnL = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    // Adjust to Monday as start of week
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    return entries
      .filter(e => new Date(e.date) >= startOfWeek)
      .reduce((sum, e) => sum + e.pnl, 0);
  }, [entries]);

  // Dynamically pull targets from the Tracker's rigorous compound calculation
  const dailyTarget = goalProgress?.nextDayTargetAmt || 0;
  const weeklyTarget = goalProgress?.weeklyTargetAmt || 0;

  const isDailyMet = dailyTarget > 0 && dailyPnL >= dailyTarget;
  const isWeeklyMet = weeklyTarget > 0 && weeklyPnL >= weeklyTarget;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Balance Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm dark:shadow-lg flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-500 dark:text-blue-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Total Balance</div>
            <div className={`text-xl font-bold ${totalBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500 dark:text-rose-400'}`}>
              {totalBalance >= 0 ? '' : '-'}{formatMoney(Math.abs(totalBalance))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Target Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm dark:shadow-lg flex justify-between items-center relative overflow-hidden transition-colors duration-300">
        {/* Progress Background */}
        <div 
          className="absolute left-0 bottom-0 h-1 bg-emerald-500/20 transition-all duration-1000"
          style={{ width: `${Math.min(100, Math.max(0, (dailyPnL / dailyTarget) * 100))}%` }}
        />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className={`p-2.5 rounded-lg ${isDailyMet ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Harian</span>
              {isDailyMet && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded">TERCAPAI</span>}
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
              <span className={dailyPnL >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>{formatMoney(dailyPnL)}</span>
              <span className="text-sm text-slate-400 dark:text-slate-500 font-normal">/ {formatMoney(dailyTarget)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Target Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm dark:shadow-lg flex justify-between items-center relative overflow-hidden transition-colors duration-300">
        {/* Progress Background */}
        <div 
           className="absolute left-0 bottom-0 h-1 bg-emerald-500/20 transition-all duration-1000"
           style={{ width: `${Math.min(100, Math.max(0, (weeklyPnL / weeklyTarget) * 100))}%` }}
        />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className={`p-2.5 rounded-lg ${isWeeklyMet ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Pekanan</span>
              {isWeeklyMet && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 rounded">TERCAPAI</span>}
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
              <span className={weeklyPnL >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}>{formatMoney(weeklyPnL)}</span>
              <span className="text-sm text-slate-400 dark:text-slate-500 font-normal">/ {formatMoney(weeklyTarget)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
