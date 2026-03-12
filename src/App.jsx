import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Activity, Download, Upload, RefreshCw, Sun, Moon } from 'lucide-react';
import Papa from 'papaparse';
import StatCards from './components/StatCards';
import TopBar from './components/TopBar';
import EquityChart from './components/EquityChart';
import CalendarHeatmap from './components/CalendarHeatmap';
import TradeHistory from './components/TradeHistory';
import TradeForm from './components/TradeForm';
import TargetTracker from './components/TargetTracker';
import AnalyticsTab from './components/AnalyticsTab';
import PlaybookTab from './components/PlaybookTab';
import JournalTab from './components/JournalTab';
import StrategyLabTab from './components/StrategyLabTab';
import GateIoSyncModal from './components/GateIoSyncModal';
import { getStartOfWeek, getDateOnly } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [journalInitialDate, setJournalInitialDate] = useState(null);
  // 15D: Auto-update state
  const [updateStatus, setUpdateStatus] = useState(null);
  const [entries, setEntries] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [chartViewMode, setChartViewMode] = useState('trades');
  const [filters, setFilters] = useState({ start: '', end: '', type: 'All', asset: 'All', tag: 'All' });
  const [goal, setGoal] = useState({
    startingCapital: 1000,
    target: 5000,
    deadline: '2026-12-31'
  });
  const [dailyLogs, setDailyLogs] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [showGateIoModal, setShowGateIoModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const loadedAccountRef = useRef('');

  // Initial Boot: Load Accounts List & Theme
  useEffect(() => {
    const initApp = async () => {
      try {
        let savedAccounts = ['Main'];
        let lastActive = 'Main';
        let savedTheme = 'dark';
        if (window.electronAPI) {
          const accs = await window.electronAPI.storeGet('pnl_accounts');
          const active = await window.electronAPI.storeGet('pnl_active_account');
          const theme = await window.electronAPI.storeGet('pnl_theme');
          if (accs) savedAccounts = JSON.parse(accs);
          if (active) lastActive = active;
          if (theme) savedTheme = theme;
        } else {
          const accs = localStorage.getItem('pnl_accounts');
          const active = localStorage.getItem('pnl_active_account');
          const theme = localStorage.getItem('pnl_theme');
          if (accs) savedAccounts = JSON.parse(accs);
          if (active) lastActive = active;
          if (theme) savedTheme = theme;
        }
        setAccounts(savedAccounts);
        setActiveAccount(lastActive);
        setIsDarkMode(savedTheme !== 'light');
      } catch (err) {
        console.error('Error init app:', err);
        setAccounts(['Main']);
        setActiveAccount('Main');
      }
    };
    initApp();
  }, []);

  // Sync theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      if (window.electronAPI) window.electronAPI.storeSet('pnl_theme', 'dark');
      else localStorage.setItem('pnl_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (window.electronAPI) window.electronAPI.storeSet('pnl_theme', 'light');
      else localStorage.setItem('pnl_theme', 'light');
    }
  }, [isDarkMode]);

  // Load specifically for active account
  useEffect(() => {
    if (!activeAccount) return;
    setIsLoaded(false);
    const loadAccountData = async () => {
      try {
        const entKey = activeAccount === 'Main' ? 'pnl_entries' : `pnl_entries_${activeAccount}`;
        const goalKey = activeAccount === 'Main' ? 'pnl_goal' : `pnl_goal_${activeAccount}`;
        const logKey = activeAccount === 'Main' ? 'pnl_daily_logs' : `pnl_daily_logs_${activeAccount}`;
        
        let savedEntries, savedGoal, savedLogs;
        if (window.electronAPI) {
          savedEntries = await window.electronAPI.storeGet(entKey);
          savedGoal = await window.electronAPI.storeGet(goalKey);
          savedLogs = await window.electronAPI.storeGet(logKey);
        } else {
          savedEntries = localStorage.getItem(entKey);
          savedGoal = localStorage.getItem(goalKey);
          savedLogs = localStorage.getItem(logKey);
        }
        
        setEntries(savedEntries ? JSON.parse(savedEntries) : []);
        setGoal(savedGoal ? JSON.parse(savedGoal) : { startingCapital: 1000, target: 5000, deadline: '2026-12-31' });
        setDailyLogs(savedLogs ? JSON.parse(savedLogs) : {});
        loadedAccountRef.current = activeAccount;
      } catch (err) {
        console.error('Error loading account data:', err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadAccountData();
  }, [activeAccount]);

  // Save changes into active account keys
  useEffect(() => {
    if (isLoaded && activeAccount && loadedAccountRef.current === activeAccount) {
      const entKey = activeAccount === 'Main' ? 'pnl_entries' : `pnl_entries_${activeAccount}`;
      const goalKey = activeAccount === 'Main' ? 'pnl_goal' : `pnl_goal_${activeAccount}`;
      const logKey = activeAccount === 'Main' ? 'pnl_daily_logs' : `pnl_daily_logs_${activeAccount}`;

      if (window.electronAPI) {
        window.electronAPI.storeSet(entKey, JSON.stringify(entries));
        window.electronAPI.storeSet(goalKey, JSON.stringify(goal));
        window.electronAPI.storeSet(logKey, JSON.stringify(dailyLogs));
        window.electronAPI.storeSet('pnl_accounts', JSON.stringify(accounts));
        window.electronAPI.storeSet('pnl_active_account', activeAccount);
      } else {
        localStorage.setItem(entKey, JSON.stringify(entries));
        localStorage.setItem(goalKey, JSON.stringify(goal));
        localStorage.setItem(logKey, JSON.stringify(dailyLogs));
        localStorage.setItem('pnl_accounts', JSON.stringify(accounts));
        localStorage.setItem('pnl_active_account', activeAccount);
      }
    }
  }, [entries, goal, dailyLogs, isLoaded, accounts, activeAccount]);

  // DESKTOP NOTIFICATION REFS (effects are below, after goalProgress is defined)
  const dailyTargetNotifiedRef = useRef(false);
  const journalReminderSentRef = useRef(false);

  // 15D: Listen for update status from main process
  useEffect(() => {
    if (window.electronAPI?.onUpdateStatus) {
      window.electronAPI.onUpdateStatus((data) => setUpdateStatus(data));
    }
  }, []);

  const addEntry = (newEntry) => setEntries(prev => [...prev, newEntry]);
  const deleteEntry = (id) => setEntries(prev => prev.filter(entry => entry.id !== id));
  const updateEntry = (updatedEntry) => setEntries(prev => prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));

  const uniqueAssets = useMemo(() => [...new Set(entries.map(e => e.asset.toUpperCase()))], [entries]);
  const uniqueTags = useMemo(() => [...new Set(entries.map(e => e.tag).filter(Boolean))], [entries]);

  // GATE.IO SYNC HANDLER
  const handleGateIoSyncSuccess = (rawTrades) => {
    // Sort oldest to newest to calculate FIFO PnL
    const sortedTrades = [...rawTrades].sort((a,b) => Number(a.create_time) - Number(b.create_time));
    
    const holdings = {};
    const newEntries = [];

    sortedTrades.forEach(trade => {
        const pair = trade.currency_pair.split('_'); // [BTC, USDT]
        const asset = pair[0];
        const quote = pair[1];
        if (quote !== 'USDT') return; // Hanya memproses pair USDT

        const isBuy = trade.side === 'buy';
        const amount = parseFloat(trade.amount);
        const price = parseFloat(trade.price);

        if (!holdings[asset]) {
            holdings[asset] = { amount: 0, total_cost: 0 };
        }

        if (isBuy) {
            holdings[asset].amount += amount;
            holdings[asset].total_cost += (amount * price);
        } else {
            // Sell evaluates PnL on Spot
            if (holdings[asset].amount > 0) {
                const avgEntryPrice = holdings[asset].total_cost / holdings[asset].amount;
                const matchedAmount = Math.min(amount, holdings[asset].amount);
                const grossPnL = (price - avgEntryPrice) * matchedAmount;
                
                holdings[asset].amount -= matchedAmount;
                holdings[asset].total_cost -= (avgEntryPrice * matchedAmount);

                const dt = new Date(Number(trade.create_time) * 1000);
                newEntries.push({
                    id: `gateio_${trade.id}`,
                    date: dt.toISOString().split('T')[0],
                    asset: asset,
                    type: 'Long',
                    pnl: parseFloat(grossPnL.toFixed(2)),
                    tag: 'Gate.io Spot',
                    notes: `API Sync: Jual ${matchedAmount} di ${price}`
                });
            }
        }
    });

    if (newEntries.length > 0) {
        const existingIds = new Set(entries.map(e => e.id));
        const toAdd = newEntries.filter(e => !existingIds.has(e.id));
        
        if (toAdd.length > 0) {
            setEntries(prev => [...prev, ...toAdd]);
            alert(`Berhasil sinkronisasi ${toAdd.length} PnL jurnal baru dari Gate.io!`);
        } else {
            alert("Sinkronisasi sukses! Tapi tidak ada trade baru yang belum tersimpan.");
        }
    } else {
        alert("Tidak ada Trade PnL (jual-beli komplit) yang berhasil dilacak di periode 30 hari ini.");
    }
    setShowGateIoModal(false);
  };

  // CSV EXPORT/IMPORT
  const fileInputRef = useRef(null);

  const handleExportCSV = () => {
    if (entries.length === 0) return alert('Tidak ada data untuk diekspor');
    
    // Sort entries by date ascending before exporting
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Map to clear headers
    const csvData = sortedEntries.map(e => ({
      Date: e.date,
      Asset: e.asset,
      Type: e.type,
      PnL: e.pnl,
      Tag: e.tag || '',
      Notes: e.notes || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MyPnL_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const importedEntries = results.data.map((row, index) => {
            // Basic validation
            if (!row.Date || !row.Asset || row.PnL === undefined) {
              throw new Error(`Format tidak valid pada baris ${index + 1}`);
            }
            return {
              id: Date.now().toString() + index, // Generate new IDs
              date: row.Date,
              asset: row.Asset,
              type: row.Type || 'Long',
              pnl: parseFloat(row.PnL),
              tag: row.Tag || '',
              notes: row.Notes || ''
            };
          }).filter(e => !isNaN(e.pnl));

          if (importedEntries.length > 0) {
            // Append or overwrite? For now, we append and remove exact duplicates based on Date+Asset+PnL
            setEntries(prev => {
              const merged = [...prev, ...importedEntries];
              // Remove duplicates (naive deduplication)
              const unique = Array.from(new Map(merged.map(item => [item.date + item.asset + item.pnl, item])).values());
              return unique;
            });
            alert(`Berhasil mengimpor ${importedEntries.length} transaksi! (${results.data.length - importedEntries.length} baris diabaikan karena format tidak valid)`);
          } else {
            alert('Tidak ada data valid yang bisa diimpor.');
          }
        } catch (error) {
          alert('Gagal mengimpor CSV: ' + error.message);
        }
        // Reset file input
        event.target.value = null;
      },
      error: (error) => {
        alert('Error parsing CSV: ' + error.message);
      }
    });
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const eDate = getDateOnly(e.date);
      if (filters.start && eDate < filters.start) return false;
      if (filters.end && eDate > filters.end) return false;
      if (filters.type !== 'All' && e.type !== filters.type) return false;
      if (filters.asset !== 'All' && e.asset.toUpperCase() !== filters.asset) return false;
      if (filters.tag !== 'All' && e.tag !== filters.tag && (filters.tag !== 'Untagged' || e.tag)) return false;
      return true;
    });
  }, [entries, filters]);

  // STATS
  const stats = useMemo(() => {
    const totalTrades = filteredEntries.length;
    const winningTrades = filteredEntries.filter(e => e.pnl > 0);
    const losingTrades = filteredEntries.filter(e => e.pnl < 0);
    
    const grossProfit = winningTrades.reduce((sum, e) => sum + e.pnl, 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, e) => sum + e.pnl, 0));
    const totalPnL = grossProfit - grossLoss;
    
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 99.99 : 0) : (grossProfit / grossLoss);
    
    const avgWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

    const expectancy = totalTrades > 0 ? totalPnL / totalTrades : 0;

    return { totalPnL, winRate, profitFactor, totalTrades, avgWin, avgLoss, grossProfit, grossLoss, expectancy };
  }, [filteredEntries]);

  // TARGET PROGRESS
  const goalProgress = useMemo(() => {
    const today = new Date();
    const deadlineDate = new Date(goal.deadline);
    const timeDiff = deadlineDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    const remainingPnL = goal.target - stats.totalPnL;
    const isReached = remainingPnL <= 0;

    const currentEquity = goal.startingCapital + stats.totalPnL;
    const targetEquity = goal.startingCapital + goal.target;

    let dailyRate = 0;
    let weeklyRate = 0;
    let nextDayTargetAmt = 0;
    let weeklyTargetAmt = 0;

    if (!isReached && daysRemaining > 0 && currentEquity > 0) {
      dailyRate = Math.pow(targetEquity / currentEquity, 1 / daysRemaining) - 1;
      weeklyRate = Math.pow(1 + dailyRate, 7) - 1;
      nextDayTargetAmt = currentEquity * dailyRate;
      weeklyTargetAmt = currentEquity * weeklyRate;
    }

    const progressPercent = Math.min(100, Math.max(0, (stats.totalPnL / goal.target) * 100));

    return {
      remainingPnL,
      daysRemaining,
      dailyRate: dailyRate * 100,
      weeklyRate: weeklyRate * 100,
      nextDayTargetAmt, 
      weeklyTargetAmt,
      progressPercent,
      isReached,
      isExpired: daysRemaining === 0 && !isReached
    };
  }, [goal, stats.totalPnL]);

  // DESKTOP NOTIFICATIONS (must be after goalProgress is defined)
  useEffect(() => {
    if (!window.electronAPI?.sendNotification) return;
    if (!goalProgress || dailyTargetNotifiedRef.current) return;
    
    const today = getDateOnly(new Date().toISOString());
    const todayPnL = entries
      .filter(e => getDateOnly(e.date) === today)
      .reduce((sum, e) => sum + e.pnl, 0);
    
    const dailyTarget = goalProgress.nextDayTargetAmt || 0;
    if (dailyTarget > 0 && todayPnL >= dailyTarget) {
      window.electronAPI.sendNotification(
        '🎯 Target Harian Tercapai!',
        `Selamat! PnL hari ini: $${todayPnL.toFixed(2)} (target: $${dailyTarget.toFixed(2)})`
      );
      dailyTargetNotifiedRef.current = true;
    }
  }, [entries, goalProgress]);

  // Daily journal reminder at 8 PM
  useEffect(() => {
    if (!window.electronAPI?.sendNotification) return;
    
    const checkReminder = () => {
      const now = new Date();
      if (now.getHours() >= 20 && !journalReminderSentRef.current) {
        const today = getDateOnly(now.toISOString());
        const todayEntries = entries.filter(e => getDateOnly(e.date) === today);
        if (todayEntries.length === 0) {
          window.electronAPI.sendNotification(
            '📝 Pengingat Jurnal',
            'Sudah malam! Jangan lupa catat jurnal trading hari ini.'
          );
          journalReminderSentRef.current = true;
        }
      }
    };
    
    const interval = setInterval(checkReminder, 60000);
    checkReminder();
    return () => clearInterval(interval);
  }, [entries]);

  // CHART DATA
  const chartData = useMemo(() => {
    if (filteredEntries.length === 0) return [];
    
    let baseData = [];
    if (chartViewMode === 'trades') {
      let cumulative = 0;
      baseData = [...filteredEntries].sort((a, b) => new Date(a.date) - new Date(b.date)).map((e, index) => {
        cumulative += e.pnl;
        return { x: index, y: cumulative, label: e.date, pnl: e.pnl, displayValue: cumulative };
      });
    } else if (chartViewMode === 'daily') {
      const daily = filteredEntries.reduce((acc, entry) => {
        const d = getDateOnly(entry.date);
        acc[d] = (acc[d] || 0) + entry.pnl;
        return acc;
      }, {});
      baseData = Object.entries(daily)
        .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
        .map(([date, pnl], index) => ({ x: index, y: pnl, label: date, pnl: pnl, displayValue: pnl }));
    } else if (chartViewMode === 'weekly') {
      const weekly = filteredEntries.reduce((acc, entry) => {
        const weekStart = getStartOfWeek(entry.date);
        acc[weekStart] = (acc[weekStart] || 0) + entry.pnl;
        return acc;
      }, {});
      baseData = Object.entries(weekly)
        .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
        .map(([date, pnl], index) => ({ x: index, y: pnl, label: `Minggu dr ${date}`, pnl: pnl, displayValue: pnl }));
    }

    let hwm = 0;
    let ddStartIndex = -1;
    let ddTradesCount = 0;
    const maPeriod = 3; 

    return baseData.map((d, index) => {
      let isNewPeak = false, recoveryInfo = null, ddAmount = 0, ddPercent = 0;

      if (d.y >= hwm || index === 0) {
        if (hwm > 0 && d.y > hwm && ddStartIndex !== -1) {
          recoveryInfo = { trades: ddTradesCount };
        }
        hwm = d.y;
        ddStartIndex = -1;
        ddTradesCount = 0;
        isNewPeak = true;
      } else {
        if (ddStartIndex === -1) ddStartIndex = index - 1;
        ddTradesCount++;
        ddAmount = d.y - hwm;
        const peakEquity = goal.startingCapital + hwm;
        ddPercent = peakEquity > 0 ? (ddAmount / peakEquity) * 100 : 0;
      }

      let maValue = null;
      if (index >= maPeriod - 1) {
        let sum = 0;
        for (let j = 0; j < maPeriod; j++) sum += baseData[index - j].y;
        maValue = sum / maPeriod;
      }

      return { ...d, hwm, isNewPeak, drawdown: ddAmount, drawdownPercent: ddPercent, recoveryInfo, maValue };
    });
  }, [filteredEntries, chartViewMode, goal.startingCapital]);

  // DAILY DATA PERCENT Heatmap
  const dailyDataWithPercent = useMemo(() => {
    const grouped = filteredEntries.reduce((acc, entry) => {
      const d = getDateOnly(entry.date);
      acc[d] = (acc[d] || 0) + entry.pnl;
      return acc;
    }, {});

    const sortedDates = [...new Set(filteredEntries.map(e => getDateOnly(e.date)))].sort();
    let cumulativePnL = 0;
    const result = {};
    
    for (const date of sortedDates) {
      const dailyPnL = grouped[date];
      const startEquity = goal.startingCapital + cumulativePnL;
      const percent = startEquity > 0 ? (dailyPnL / startEquity) * 100 : 0;
      
      result[date] = { pnl: dailyPnL, percent };
      cumulativePnL += dailyPnL;
    }
    return result;
  }, [filteredEntries, goal.startingCapital]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const calendarDays = useMemo(() => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayData = dailyDataWithPercent[dateStr];
      days.push({ 
        day: i, 
        dateStr, 
        pnl: dayData?.pnl, 
        percent: dayData?.percent 
      });
    }
    return days;
  }, [currentMonth, dailyDataWithPercent, daysInMonth, firstDayOfMonth]);


  if (!isLoaded) return <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e17] flex items-center justify-center text-emerald-500 font-medium">Loading Journal...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e17] text-slate-800 dark:text-slate-300 font-sans selection:bg-blue-500/30 pb-12 transition-colors duration-300">
      <nav className="border-b border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0d131f] sticky top-0 z-50 transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">MyPnL<span className="text-emerald-600 dark:text-emerald-500">.pro</span></span>
            </div>
            
            <div className="hidden sm:flex items-center space-x-1 bg-slate-100 dark:bg-[#0a0e17] p-1 rounded-lg border border-slate-200 dark:border-slate-800">
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('analytics')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Analytics</button>
              <button onClick={() => setActiveTab('strategylab')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'strategylab' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Strategy Lab</button>
              <button onClick={() => setActiveTab('playbook')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'playbook' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Playbook</button>
              <button onClick={() => setActiveTab('journal')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'journal' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Journal</button>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 text-sm font-medium">
            <div className="flex items-center bg-slate-100 dark:bg-[#0a0e17] rounded-lg p-1 border border-slate-200 dark:border-slate-800">
              <select 
                value={activeAccount} 
                onChange={(e) => {
                  if (e.target.value === 'NEW_ACCOUNT') {
                    const name = prompt('Nama Portofolio Baru (mis. Futures, Saham):');
                    if (name && name.trim() && !accounts.includes(name.trim())) {
                      setAccounts([...accounts, name.trim()]);
                      setActiveAccount(name.trim());
                    }
                  } else if (e.target.value === 'DELETE_ACCOUNT') {
                     if (accounts.length > 1) {
                       const confirm = window.confirm(`Hapus portofolio '${activeAccount}' secara permanen?`);
                       if (confirm) {
                         const remaining = accounts.filter(a => a !== activeAccount);
                         setAccounts(remaining);
                         setActiveAccount(remaining[0]);
                       }
                     } else {
                       alert('Minimal harus ada 1 portofolio utama.');
                     }
                  } else {
                    setActiveAccount(e.target.value);
                  }
                }} 
                className="bg-transparent text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 focus:outline-none px-2 sm:px-3 py-1 sm:py-1.5 cursor-pointer max-w-[140px] sm:max-w-xs truncate"
                title="Pilih Portofolio Jurnal"
              >
                {accounts.map(acc => <option key={acc} value={acc} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">{acc}</option>)}
                <option disabled>──────────</option>
                <option value="NEW_ACCOUNT" className="bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-semibold">+ Akun Baru</option>
                <option value="DELETE_ACCOUNT" className="bg-white dark:bg-slate-900 text-rose-500 dark:text-rose-400 font-semibold">- Hapus Akun</option>
              </select>
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-[#0a0e17] rounded-lg p-1 border border-slate-200 dark:border-slate-800 mr-2">
              <button onClick={() => setShowGateIoModal(true)} className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors" title="Sync from Gate.io API">
                <RefreshCw className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
              <button onClick={handleExportCSV} className="p-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors" title="Export to CSV">
                <Download className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
              <button onClick={() => fileInputRef.current?.click()} className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors" title="Import from CSV">
                <Upload className="w-4 h-4" />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
            </div>

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-1.5 text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 bg-slate-100 hover:bg-white dark:bg-[#0a0e17] dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline-block ml-4">Status: <span className="text-emerald-600 dark:text-emerald-400">Live Desktop</span></span>
          </div>
        </div>
      </nav>

      <nav className="border-b border-slate-200 dark:border-slate-800/60 bg-white dark:bg-[#0d131f] sticky top-0 z-50 transition-colors duration-300">
        {/* ... Mobile Tabs (visible only on small screens) ... */}
        <div className="sm:hidden flex items-center justify-center space-x-1 bg-slate-100 dark:bg-[#0a0e17] p-2 border-t border-slate-200 dark:border-slate-800 w-full transition-colors duration-300 overflow-x-auto">
           <button onClick={() => setActiveTab('dashboard')} className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Dashboard</button>
           <button onClick={() => setActiveTab('analytics')} className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Analytics</button>
           <button onClick={() => setActiveTab('strategylab')} className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'strategylab' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Strategy Lab</button>
           <button onClick={() => setActiveTab('playbook')} className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'playbook' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Playbook</button>
           <button onClick={() => setActiveTab('journal')} className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === 'journal' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Journal</button>
        </div>
      </nav>

      {/* 15D: Update Banner */}
      {updateStatus && updateStatus.status !== 'not-available' && updateStatus.status !== 'checking' && (
        <div className={`w-full px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-3 transition-all ${
          updateStatus.status === 'error' ? 'bg-rose-500/10 text-rose-500' :
          updateStatus.status === 'downloaded' ? 'bg-emerald-500/10 text-emerald-500' :
          'bg-blue-500/10 text-blue-500'
        }`}>
          {updateStatus.status === 'available' && <span>🔄 Versi {updateStatus.version} tersedia, sedang mengunduh...</span>}
          {updateStatus.status === 'downloading' && <span>⬇️ Mengunduh update... {updateStatus.percent}%</span>}
          {updateStatus.status === 'downloaded' && (
            <>
              <span>✅ Versi {updateStatus.version} siap diinstall!</span>
              <button onClick={() => window.electronAPI?.installUpdate()} className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-md hover:bg-emerald-600 transition-colors">Update & Restart</button>
            </>
          )}
          {updateStatus.status === 'error' && <span>❌ Gagal update: {updateStatus.message}</span>}
        </div>
      )}

      <main className="w-full px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {activeTab === 'dashboard' ? (
          <>
            <TopBar entries={filteredEntries} goal={goal} goalProgress={goalProgress} />
            <StatCards stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <EquityChart 
                 chartData={chartData} 
                 chartViewMode={chartViewMode} setChartViewMode={setChartViewMode}
                 filters={filters} setFilters={setFilters} uniqueAssets={uniqueAssets} uniqueTags={uniqueTags}
                 goal={goal} goalProgress={goalProgress} stats={stats} 
              />
              <CalendarHeatmap 
                 calendarDays={calendarDays} 
                 currentMonth={currentMonth} 
                 setCurrentMonth={setCurrentMonth}
                 dailyLogs={dailyLogs}
                 selectedDate={filters.start === filters.end ? filters.start : null}
                 onDayClick={(dateStr) => {
                   if (filters.start === dateStr && filters.end === dateStr) {
                     // Toggle off: clicking the same date resets the filter
                     setFilters(prev => ({...prev, start: '', end: ''}));
                   } else {
                     setFilters(prev => ({...prev, start: dateStr, end: dateStr}));
                   }
                 }}
                 onJournalClick={(dateStr) => {
                   setJournalInitialDate(dateStr);
                   setActiveTab('journal');
                 }}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="space-y-6 lg:col-span-2 h-fit sticky top-20">
                <TradeForm onAddEntry={addEntry} lastDate={filteredEntries.length > 0 ? filteredEntries[0].date : ''} />
                <TargetTracker goal={goal} setGoal={setGoal} goalProgress={goalProgress} entries={entries} />
              </div>
              <TradeHistory entries={filteredEntries} deleteEntry={deleteEntry} updateEntry={updateEntry} />
            </div>
          </>
        ) : activeTab === 'analytics' ? (
          <AnalyticsTab entries={filteredEntries} goal={goal} />
        ) : activeTab === 'strategylab' ? (
          <StrategyLabTab entries={filteredEntries} accountName={activeAccount} />
        ) : activeTab === 'playbook' ? (
          <PlaybookTab entries={filteredEntries} updateEntry={updateEntry} />
        ) : activeTab === 'journal' ? (
          <JournalTab entries={filteredEntries} dailyLogs={dailyLogs} setDailyLogs={setDailyLogs} initialDate={journalInitialDate} />
        ) : null}
      </main>

      {showGateIoModal && (
        <GateIoSyncModal 
          onClose={() => setShowGateIoModal(false)} 
          onSyncSuccess={handleGateIoSyncSuccess} 
        />
      )}
    </div>
  );
}
