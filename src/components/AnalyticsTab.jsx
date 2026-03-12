import React, { useMemo } from 'react';
import { PieChart, Activity, TrendingUp, TrendingDown, Target, Clock, AlertCircle } from 'lucide-react';
import { formatMoney, getDateOnly } from '../lib/utils';
import TimeAnalysisChart from './TimeAnalysisChart';

export default function AnalyticsTab({ entries, goal }) {
  const analyticsData = useMemo(() => {
    if (entries.length === 0) return null;

    const startingCapital = Number(goal?.startingCapital) || 0;

    // 1. Long vs Short Performance
    const longTrades = entries.filter(e => e.type === 'Long');
    const shortTrades = entries.filter(e => e.type === 'Short');

    const calcStats = (trades) => {
      const wins = trades.filter(t => t.pnl > 0);
      const losses = trades.filter(t => t.pnl < 0);
      const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
      const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
      const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
      
      const winRate = trades.length > 0 ? (wins.length / trades.length) : 0;
      const lossRate = 1 - winRate;
      
      const expectancy = (winRate * avgWin) - (lossRate * avgLoss);

      return {
        total: trades.length,
        wins: wins.length,
        losses: losses.length,
        winRate: winRate * 100,
        netPnL: grossProfit - grossLoss,
        grossProfit,
        grossLoss,
        profitFactor: grossLoss === 0 ? (grossProfit > 0 ? 99.99 : 0) : grossProfit / grossLoss,
        expectancy
      };
    };

    const longStats = calcStats(longTrades);
    const shortStats = calcStats(shortTrades);
    const globalStats = calcStats(entries);

    // Calc Streak
    let currentStreakCount = 0;
    let isWinStreak = null;
    let streakPnL = 0;
    
    // entries are newest to oldest natively
    for (let i = 0; i < entries.length; i++) {
        const trade = entries[i];
        const isWin = trade.pnl > 0;
        
        if (i === 0) {
            isWinStreak = isWin;
            currentStreakCount = 1;
            streakPnL = trade.pnl;
        } else {
            if ((isWin && isWinStreak) || (!isWin && !isWinStreak)) {
                currentStreakCount++;
                streakPnL += trade.pnl;
            } else {
                break; // streak broke
            }
        }
    }

    // Calc Max Drawdown
    let peak = startingCapital;
    let maxDrawdownAmt = 0;
    let maxDrawdownPct = 0;
    let currentBalance = startingCapital;

    // sort oldest to newest to trace equity curve
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    sortedEntries.forEach(trade => {
       currentBalance += trade.pnl;
       if (currentBalance > peak) peak = currentBalance;
       
       const ddAmt = peak - currentBalance;
       const ddPct = peak > 0 ? (ddAmt / peak) * 100 : 0;
       
       if (ddAmt > maxDrawdownAmt) maxDrawdownAmt = ddAmt;
       if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;
    });

    // 2. Asset Performance
    const assetStats = {};
    entries.forEach(e => {
      const asset = e.asset.toUpperCase();
      if (!assetStats[asset]) {
        assetStats[asset] = { name: asset, trades: 0, wins: 0, netPnL: 0 };
      }
      assetStats[asset].trades += 1;
      if (e.pnl > 0) assetStats[asset].wins += 1;
      assetStats[asset].netPnL += e.pnl;
    });
    
    const assetList = Object.values(assetStats).map(a => ({
      ...a,
      winRate: (a.wins / a.trades) * 100
    })).sort((a, b) => b.netPnL - a.netPnL);

    const bestAsset = assetList[0];
    const worstAsset = assetList[assetList.length - 1];

    // 3. Performance by Day of Week
    const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dayStats = Array(7).fill(null).map((_, i) => ({ day: daysOfWeek[i], trades: 0, wins: 0, netPnL: 0 }));
    
    entries.forEach(e => {
      const date = new Date(getDateOnly(e.date));
      const dayIndex = date.getDay();
      dayStats[dayIndex].trades += 1;
      if (e.pnl > 0) dayStats[dayIndex].wins += 1;
      dayStats[dayIndex].netPnL += e.pnl;
    });

    const activeDayStats = dayStats.filter(d => d.trades > 0).map(d => ({
      ...d,
      winRate: (d.wins / d.trades) * 100
    }));
    
    const bestDay = [...activeDayStats].sort((a, b) => b.netPnL - a.netPnL)[0];
    const worstDay = [...activeDayStats].sort((a, b) => a.netPnL - b.netPnL)[0];

    // 4. Strategy Tags Performance
    const tagStats = {};
    entries.forEach(e => {
      const tag = e.tag || 'Untagged';
      if (!tagStats[tag]) {
        tagStats[tag] = { name: tag, trades: 0, wins: 0, netPnL: 0 };
      }
      tagStats[tag].trades += 1;
      if (e.pnl > 0) tagStats[tag].wins += 1;
      tagStats[tag].netPnL += e.pnl;
    });

    const tagList = Object.values(tagStats).map(t => ({
      ...t,
      winRate: (t.wins / t.trades) * 100
    })).sort((a, b) => b.netPnL - a.netPnL);

    return {
      globalStats, longStats, shortStats, maxDrawdownAmt, maxDrawdownPct, 
      currentStreakCount, isWinStreak, streakPnL,
      bestAsset, worstAsset, assetList,
      bestDay, worstDay, dayStats: activeDayStats,
      tagList
    };
  }, [entries]);

  if (!analyticsData) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-12 text-center text-slate-500 dark:text-slate-500 shadow-sm dark:shadow-none transition-colors duration-300">
        <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Belum ada cukup data transaksi untuk menghasilkan visualisasi analitik.</p>
      </div>
    );
  }

  const { globalStats, longStats, shortStats, maxDrawdownAmt, maxDrawdownPct, currentStreakCount, isWinStreak, streakPnL, bestAsset, worstAsset, assetList, bestDay, worstDay, tagList } = analyticsData;

  const getBarWidth = (value, max) => `${Math.max(5, Math.min(100, (Math.abs(value) / Math.max(1, Math.abs(max))) * 100))}%`;

  return (
    <div className="space-y-6">
      
      {/* 8-Grid Advanced Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        
        {/* Profit Factor */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-4 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Profit Factor</div>
          <div className={`text-2xl font-bold ${globalStats.profitFactor >= 1.5 ? 'text-emerald-500' : globalStats.profitFactor >= 1 ? 'text-blue-500' : 'text-rose-500'}`}>
            {globalStats.profitFactor >= 99 ? '∞' : globalStats.profitFactor.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 mt-1">{globalStats.profitFactor >= 1.5 ? 'Sangat Sehat' : globalStats.profitFactor >= 1 ? 'Cukup' : 'Evaluasi Strategi'}</div>
        </div>

        {/* Expectancy */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-4 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Expectancy / Trade</div>
          <div className={`text-2xl font-bold ${globalStats.expectancy > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {globalStats.expectancy > 0 ? '+' : ''}{formatMoney(globalStats.expectancy)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Harapan Cuan Matematis</div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-4 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Max Drawdown</div>
          <div className="text-2xl font-bold text-rose-500">
            -{maxDrawdownPct.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Lembah Terdalam ({formatMoney(maxDrawdownAmt)})</div>
        </div>

        {/* Current Streak */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-4 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Runtutan Terkini (Streak)</div>
          <div className={`text-2xl font-bold ${currentStreakCount > 0 ? (isWinStreak ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-500'}`}>
            {currentStreakCount > 0 ? `${currentStreakCount} ${isWinStreak ? 'Win' : 'Loss'}` : '-'}
          </div>
          <div className={`text-xs mt-1 ${currentStreakCount > 0 ? (isWinStreak ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400') : 'text-slate-500'}`}>
             {streakPnL > 0 ? '+' : ''}{formatMoney(streakPnL)}
          </div>
        </div>

        {/* Best Asset */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-4 rounded-xl flex items-center justify-between shadow-sm dark:shadow-none transition-colors duration-300">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Aset Terbaik</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{bestAsset?.name || '-'}</div>
          </div>
          <div className={`text-right text-sm font-bold ${bestAsset?.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {bestAsset?.netPnL >= 0 ? '+' : ''}{formatMoney(bestAsset?.netPnL || 0)}
          </div>
        </div>

        {/* Worst Asset */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-4 rounded-xl flex items-center justify-between shadow-sm dark:shadow-none transition-colors duration-300">
           <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Aset Terburuk</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{worstAsset?.name || '-'}</div>
          </div>
          <div className={`text-right text-sm font-bold ${worstAsset?.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {worstAsset?.netPnL >= 0 ? '+' : ''}{formatMoney(worstAsset?.netPnL || 0)}
          </div>
        </div>

        {/* Best Day */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-4 rounded-xl flex items-center justify-between shadow-sm dark:shadow-none transition-colors duration-300">
           <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Hari Terbaik</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{bestDay?.day || '-'}</div>
          </div>
          <div className={`text-right text-sm font-bold text-emerald-500`}>
             WR: {bestDay?.winRate.toFixed(0)}%
          </div>
        </div>

        {/* Worst Day */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-4 rounded-xl flex items-center justify-between shadow-sm dark:shadow-none transition-colors duration-300">
           <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Hari Terburuk</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">{worstDay?.day || '-'}</div>
          </div>
          <div className={`text-right text-sm font-bold text-rose-500`}>
             WR: {worstDay?.winRate.toFixed(0)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Long vs Short Battle Line */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 p-6 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300 flex flex-col justify-center">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center"><Target className="w-5 h-5 mr-2 text-indigo-500"/> Long vs Short Power</h3>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span className="text-emerald-600 dark:text-emerald-400">Long PnL: {formatMoney(longStats.netPnL)}</span>
              <span className="text-rose-600 dark:text-rose-400">Short PnL: {formatMoney(shortStats.netPnL)}</span>
            </div>
            
            {/* Visual Battle Bar */}
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
               {longStats.netPnL > 0 && (
                 <div 
                   className="h-full bg-emerald-500" 
                   style={{ width: `${Math.max(5, (longStats.netPnL / (Math.max(0, longStats.netPnL) + Math.max(0, shortStats.netPnL))) * 100)}%` }}
                 ></div>
               )}
               {shortStats.netPnL > 0 && (
                 <div 
                   className="h-full bg-rose-500" 
                   style={{ width: `${Math.max(5, (shortStats.netPnL / (Math.max(0, longStats.netPnL) + Math.max(0, shortStats.netPnL))) * 100)}%` }}
                 ></div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Stats Legend */}
             <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0a0e17] border border-slate-100 dark:border-slate-800/60">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">Longs</div>
                  <div className="text-xs text-slate-500">{longStats.total} Trades</div>
                </div>
                <div className="text-right text-sm font-bold text-emerald-600 dark:text-emerald-500">
                  WR: {longStats.winRate.toFixed(0)}%
                </div>
             </div>
             
             <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0a0e17] border border-slate-100 dark:border-slate-800/60">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">Shorts</div>
                  <div className="text-xs text-slate-500">{shortStats.total} Trades</div>
                </div>
                <div className="text-right text-sm font-bold text-rose-600 dark:text-rose-500">
                  WR: {shortStats.winRate.toFixed(0)}%
                </div>
             </div>
          </div>
        </div>

        {/* Strategy Tags Performance */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-300">
          <h3 className="text-slate-800 dark:text-slate-200 font-semibold mb-6 flex items-center">
            <PieChart className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" /> Performa Berdasarkan Tag Strategi
          </h3>
          
          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {tagList.map(t => (
              <div key={t.name} className="flex flex-col">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{t.name} <span className="text-slate-500 text-xs ml-1">({t.trades})</span></span>
                  <span className={`font-bold ${t.netPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {t.netPnL >= 0 ? '+' : ''}{formatMoney(t.netPnL)}
                  </span>
                </div>
                <div className="flex items-center text-xs text-slate-500 gap-3">
                  <span>Win: {t.winRate.toFixed(0)}%</span>
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-[#0a0e17] rounded-full overflow-hidden">
                    <div className={`h-full ${t.netPnL >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                         style={{ width: getBarWidth(t.netPnL, tagList[0]?.netPnL) }}>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {tagList.length === 0 && <div className="text-slate-500 text-sm italic">Belum ada strategi yang di-tag.</div>}
          </div>
        </div>
      </div>
      
      {/* Asset Performance Breakdown */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-6 shadow-sm dark:shadow-none transition-colors duration-300">
        <h3 className="text-slate-800 dark:text-slate-200 font-semibold mb-6 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" /> Distribusi PnL per Aset
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assetList.map(a => (
            <div key={a.name} className="border border-slate-200 dark:border-slate-800/50 bg-slate-50 dark:bg-[#0a0e17] rounded-lg p-4 transition-colors">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-lg text-slate-800 dark:text-slate-200">{a.name}</span>
                <span className={`font-bold text-sm px-2 py-0.5 rounded ${a.netPnL >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                  {a.netPnL >= 0 ? '+' : ''}{formatMoney(a.netPnL)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-500">Total Trades:<br/><span className="text-slate-700 dark:text-slate-300 text-sm font-semibold">{a.trades}</span></div>
                <div className="text-slate-500 text-right">Win Rate:<br/><span className="text-slate-900 dark:text-white text-sm font-semibold">{a.winRate.toFixed(1)}%</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Analysis Chart */}
      <TimeAnalysisChart entries={entries} />
    </div>
  );
}
