import React from 'react';
import { DollarSign, Percent, Target, Crosshair, Zap } from 'lucide-react';
import { formatMoney } from '../lib/utils';

export default function StatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-5 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2">
          <DollarSign className="w-4 h-4 mr-1.5" /> <span className="text-xs font-semibold uppercase tracking-wider">Net PnL</span>
        </div>
        <div className={`text-2xl md:text-3xl font-bold ${stats.totalPnL >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
          {stats.totalPnL >= 0 ? '+' : ''}{formatMoney(stats.totalPnL)}
        </div>
      </div>
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-5 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2">
          <Percent className="w-4 h-4 mr-1.5" /> <span className="text-xs font-semibold uppercase tracking-wider">Win Rate</span>
        </div>
        <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          {stats.winRate.toFixed(1)}%
        </div>
      </div>
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-5 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2">
          <Target className="w-4 h-4 mr-1.5" /> <span className="text-xs font-semibold uppercase tracking-wider">Profit Factor</span>
        </div>
        <div className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">
          {stats.profitFactor.toFixed(2)}
        </div>
      </div>
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-5 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2">
          <Zap className="w-4 h-4 mr-1.5" /> <span className="text-xs font-semibold uppercase tracking-wider">Expectancy</span>
        </div>
        <div className={`text-2xl md:text-3xl font-bold ${stats.expectancy > 0 ? 'text-emerald-500 dark:text-emerald-400' : stats.expectancy < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
          {stats.expectancy > 0 ? '+' : ''}{formatMoney(stats.expectancy)}
        </div>
      </div>
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-5 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2">
          <Crosshair className="w-4 h-4 mr-1.5" /> <span className="text-xs font-semibold uppercase tracking-wider">Total Trades</span>
        </div>
        <div className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          {stats.totalTrades}
        </div>
      </div>
    </div>
  );
}
