import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TrendingUp, Filter, Activity } from 'lucide-react';
import { formatMoney } from '../lib/utils';

export default function EquityChart({ chartData, chartViewMode, setChartViewMode, filters, setFilters, uniqueAssets, uniqueTags, goal, goalProgress, stats }) {
  const [hoveredData, setHoveredData] = useState(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const chartContainerRef = useRef(null);

  // 13C: Responsive width via ResizeObserver
  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const chartHeight = 280;
  const chartWidth = Math.max(400, containerWidth);
  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 20;

  const barAreaHeight = 60;
  const xAxisHeight = 22;
  const mainChartHeight = chartHeight - barAreaHeight - xAxisHeight;

  let currentTargetLine = 0;
  let targetLabel = '';

  if (chartViewMode === 'trades') {
    currentTargetLine = goal.target;
    targetLabel = `🎯 TARGET: ${formatMoney(goal.target)}`;
  } else if (chartViewMode === 'daily') {
    currentTargetLine = goalProgress.nextDayTargetAmt;
    targetLabel = `🎯 TGT HARIAN: ${formatMoney(currentTargetLine)}`;
  } else if (chartViewMode === 'weekly') {
    currentTargetLine = goalProgress.weeklyTargetAmt;
    targetLabel = `🎯 TGT MINGGUAN: ${formatMoney(currentTargetLine)}`;
  }

  const dataMin = Math.min(0, ...chartData.map(d => d.y));
  const dataMax = Math.max(0, ...chartData.map(d => d.y));
  const maxEquity = dataMax + (Math.abs(dataMax) * 0.1) || 10;
  const minEquity = dataMin - (Math.abs(dataMin) * 0.1);
  const rangeY = (maxEquity - minEquity) || 1;

  const scaleX = (x) => paddingLeft + (x / Math.max(1, chartData.length - 1)) * (chartWidth - paddingLeft - paddingRight);
  const scaleY = (y) => paddingTop + ((maxEquity - y) / rangeY) * (mainChartHeight - paddingTop * 2);

  const isTargetOffChart = currentTargetLine > maxEquity;
  const targetY = isTargetOffChart ? paddingTop : scaleY(currentTargetLine);

  // 13A: Y-axis ticks
  const yTickCount = 5;
  const yTicks = [];
  for (let i = 0; i <= yTickCount; i++) {
    const val = minEquity + (rangeY * i / yTickCount);
    yTicks.push({ val, y: scaleY(val) });
  }

  // 13B: X-axis labels
  const xLabels = [];
  if (chartData.length > 0) {
    const maxLabels = Math.min(8, chartData.length);
    const step = Math.max(1, Math.floor((chartData.length - 1) / (maxLabels - 1)));
    for (let i = 0; i < chartData.length; i += step) {
      xLabels.push({ x: scaleX(chartData[i].x), label: chartData[i].label || `#${i + 1}` });
    }
    // Always include the last point
    const last = chartData[chartData.length - 1];
    const lastX = scaleX(last.x);
    if (!xLabels.find(l => Math.abs(l.x - lastX) < 30)) {
      xLabels.push({ x: lastX, label: last.label || `#${chartData.length}` });
    }
  }

  let linePath = '';
  if (chartData.length > 0) {
    linePath = `M ${scaleX(chartData[0].x)} ${scaleY(chartData[0].y)}`;
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1];
      const curr = chartData[i];
      const cpX = (scaleX(prev.x) + scaleX(curr.x)) / 2;
      linePath += ` C ${cpX} ${scaleY(prev.y)}, ${cpX} ${scaleY(curr.y)}, ${scaleX(curr.x)} ${scaleY(curr.y)}`;
    }
  }

  const areaPath = chartData.length > 0
    ? `${linePath} L ${scaleX(chartData[chartData.length - 1].x)} ${scaleY(minEquity)} L ${scaleX(0)} ${scaleY(minEquity)} Z`
    : '';

  let maPath = '';
  const maPoints = chartData.filter(d => d.maValue !== null);
  if (maPoints.length > 0) {
    maPath = `M ${scaleX(maPoints[0].x)} ${scaleY(maPoints[0].maValue)}`;
    for (let i = 1; i < maPoints.length; i++) {
      maPath += ` L ${scaleX(maPoints[i].x)} ${scaleY(maPoints[i].maValue)}`; 
    }
  }

  const zeroY = scaleY(0);

  const barBaseY = mainChartHeight + xAxisHeight + (barAreaHeight / 2);
  const maxBarHeight = (barAreaHeight / 2) - 5;
  const maxAbsPnL = Math.max(...chartData.map(d => Math.abs(d.pnl)), 1);
  const getBarHeight = (pnl) => (Math.abs(pnl) / maxAbsPnL) * maxBarHeight;

  // Format compact numbers for Y axis
  const formatAxisValue = (val) => {
    const abs = Math.abs(val);
    if (abs >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (abs >= 1000) return `${(val / 1000).toFixed(1)}K`;
    if (abs >= 100) return val.toFixed(0);
    return val.toFixed(2);
  };

  const totalSvgHeight = chartHeight + xAxisHeight;

  return (
    <div className="lg:col-span-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/60 rounded-xl p-5 flex flex-col shadow-sm dark:shadow-none transition-colors duration-300">
      <div className="flex flex-col 2xl:flex-row justify-between 2xl:items-center mb-4 gap-3">
        <h3 className="text-slate-800 dark:text-slate-200 font-semibold flex items-center">
          <TrendingUp className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
          {chartViewMode === 'trades' ? 'Kurva Ekuitas (Cumulative)' : chartViewMode === 'daily' ? 'Performa Harian (Net PnL)' : 'Performa Mingguan (Net PnL)'}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          {/* Advanced Filters */}
          <div className="flex items-center bg-slate-50 dark:bg-[#0a0e17] rounded-lg p-1 border border-slate-200 dark:border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500 mx-1" />
            <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })} className="bg-transparent text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 focus:outline-none px-1 cursor-pointer">
              <option value="All" className="bg-white dark:bg-slate-900">Semua Posisi</option>
              <option value="Long" className="bg-white dark:bg-slate-900">Long</option>
              <option value="Short" className="bg-white dark:bg-slate-900">Short</option>
            </select>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <select value={filters.asset} onChange={e => setFilters({ ...filters, asset: e.target.value })} className="bg-transparent text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 focus:outline-none px-1 cursor-pointer max-w-[90px] truncate">
              <option value="All" className="bg-white dark:bg-slate-900">Semua Aset</option>
              {uniqueAssets.map(a => <option key={a} value={a} className="bg-white dark:bg-slate-900">{a}</option>)}
            </select>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <select value={filters.tag} onChange={e => setFilters({ ...filters, tag: e.target.value })} className="bg-transparent text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 focus:outline-none px-1 cursor-pointer max-w-[90px] truncate">
              <option value="All" className="bg-white dark:bg-slate-900">Semua Strategi</option>
              {uniqueTags.map(t => <option key={t} value={t} className="bg-white dark:bg-slate-900">{t}</option>)}
              <option value="Untagged" className="bg-white dark:bg-slate-900 italic">Tanpa Tag</option>
            </select>
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-50 dark:bg-[#0a0e17] rounded-lg p-1 border border-slate-200 dark:border-slate-800">
            <input type="date" value={filters.start} onChange={(e) => setFilters(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 focus:outline-none px-1 sm:px-2 py-1 rounded dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert" title="Dari Tanggal" />
            <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>
            <input type="date" value={filters.end} onChange={(e) => setFilters(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 focus:outline-none px-1 sm:px-2 py-1 rounded dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:invert" title="Sampai Tanggal" />
          </div>

          {/* Toggle View */}
          <div className="flex bg-slate-50 dark:bg-[#0a0e17] rounded-lg p-1 border border-slate-200 dark:border-slate-800">
            <button onClick={() => setChartViewMode('trades')} className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${chartViewMode === 'trades' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Trades</button>
            <button onClick={() => setChartViewMode('daily')} className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${chartViewMode === 'daily' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Harian</button>
            <button onClick={() => setChartViewMode('weekly')} className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-colors ${chartViewMode === 'weekly' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm dark:shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Mingguan</button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative min-h-[300px] w-full bg-slate-50 dark:bg-[#0a0e17] rounded-lg border border-slate-200 dark:border-slate-800/50" ref={chartContainerRef}>
        {chartData.length < 2 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 dark:text-slate-500 text-sm text-center px-4">
            <span>Butuh minimal 2 data untuk menampilkan kurva dan analisis.</span>
          </div>
        ) : (
          <>
            {/* 13D: Legend */}
            <div className="absolute top-2 right-3 z-10 flex items-center gap-3 text-[10px] font-medium bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm rounded-md px-2 py-1 border border-slate-200 dark:border-slate-700/50">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400 rounded-full inline-block"></span> <span className="text-slate-600 dark:text-slate-400">Ekuitas</span></span>
              {maPath && <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 rounded-full inline-block border-t border-dashed border-blue-400"></span> <span className="text-slate-600 dark:text-slate-400">MA-3</span></span>}
              {currentTargetLine > 0 && <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 rounded-full inline-block border-t border-dashed border-yellow-400"></span> <span className="text-slate-600 dark:text-slate-400">Target</span></span>}
            </div>

            <svg viewBox={`0 0 ${chartWidth} ${totalSvgHeight}`} className="w-full h-full equity-chart-svg" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Bar area background */}
              <rect x="0" y={mainChartHeight + xAxisHeight} width={chartWidth} height={barAreaHeight} className="fill-slate-100 dark:fill-[#0d131f] opacity-80 dark:opacity-60" />
              <line x1={paddingLeft} y1={barBaseY} x2={chartWidth - paddingRight} y2={barBaseY} className="stroke-slate-300 dark:stroke-[#334155]" strokeWidth="1" strokeDasharray="2 4" />

              {/* 13A: Y-axis labels & grid lines */}
              {yTicks.map((tick, i) => (
                <g key={`ytick-${i}`}>
                  <line x1={paddingLeft} y1={tick.y} x2={chartWidth - paddingRight} y2={tick.y} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" strokeDasharray="3 3" />
                  <text x={paddingLeft - 8} y={tick.y + 3.5} textAnchor="end" fill="currentColor" className="text-[9px] fill-slate-400 dark:fill-slate-500" fontFamily="system-ui, sans-serif" fontSize="9">
                    ${formatAxisValue(tick.val)}
                  </text>
                </g>
              ))}

              {/* Zero line */}
              <line x1={paddingLeft} y1={zeroY} x2={chartWidth - paddingRight} y2={zeroY} className="stroke-slate-300 dark:stroke-[#334155]" strokeWidth="1" strokeDasharray="4 4" />

              {/* 13B: X-axis labels */}
              {xLabels.map((label, i) => (
                <text key={`xlabel-${i}`} x={label.x} y={mainChartHeight + 14} textAnchor="middle" fill="currentColor" className="text-[8px] fill-slate-400 dark:fill-slate-500" fontFamily="system-ui, sans-serif" fontSize="8">
                  {label.label.length > 8 ? label.label.substring(0, 8) : label.label}
                </text>
              ))}

              {/* Y-axis vertical line */}
              <line x1={paddingLeft} y1={paddingTop - 5} x2={paddingLeft} y2={mainChartHeight} className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="1" />

              {/* Target Line */}
              {currentTargetLine > 0 && (
                <g className="opacity-80">
                  <line x1={paddingLeft} y1={targetY} x2={chartWidth - paddingRight} y2={targetY} stroke="#eab308" strokeWidth="1.5" strokeDasharray="6 4" />
                  <text x={paddingLeft + 5} y={targetY - 6} fill="#eab308" fontSize="10" fontWeight="bold" className="tracking-wider">
                    {targetLabel} {isTargetOffChart ? '(↑)' : ''}
                  </text>
                </g>
              )}

              {/* 13E: Crosshair (vertical + horizontal) */}
              {hoveredData && (
                <g>
                  <line x1={scaleX(hoveredData.x)} y1={paddingTop} x2={scaleX(hoveredData.x)} y2={mainChartHeight} stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1={paddingLeft} y1={scaleY(hoveredData.y)} x2={chartWidth - paddingRight} y2={scaleY(hoveredData.y)} stroke="#475569" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                  {/* Y-axis value badge */}
                  <rect x={0} y={scaleY(hoveredData.y) - 8} width={paddingLeft - 4} height={16} rx="3" className="fill-slate-700 dark:fill-slate-200" opacity="0.9" />
                  <text x={paddingLeft - 8} y={scaleY(hoveredData.y) + 3.5} textAnchor="end" fontSize="8" fontWeight="bold" className="fill-white dark:fill-slate-900">{formatAxisValue(hoveredData.y)}</text>
                  {hoveredData.drawdown < 0 && (
                    <>
                      <line x1={paddingLeft} y1={scaleY(hoveredData.hwm)} x2={chartWidth - paddingRight} y2={scaleY(hoveredData.hwm)} stroke="#fb7185" strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />
                      <line x1={scaleX(hoveredData.x)} y1={scaleY(hoveredData.hwm)} x2={scaleX(hoveredData.x)} y2={scaleY(hoveredData.y)} stroke="#fb7185" strokeWidth="1.5" opacity="0.8" />
                      <circle cx={scaleX(hoveredData.x)} cy={scaleY(hoveredData.hwm)} r="3" fill="#fb7185" opacity="0.8" />
                    </>
                  )}
                </g>
              )}

              {/* 13F: Animated area + line */}
              <path d={areaPath} fill="url(#equityGradient)" className="equity-area-anim" />
              <path d={linePath} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="equity-line-anim" />

              {maPath && <path d={maPath} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.7" />}

              {/* PnL bars */}
              {chartData.map((d, i) => {
                const isProfit = d.pnl >= 0;
                const h = getBarHeight(d.pnl);
                const y = isProfit ? barBaseY - h : barBaseY;
                const isHovered = hoveredData?.x === d.x;

                return (
                  <rect key={`bar-${i}`} x={scaleX(d.x) - 4} y={y} width="8" height={Math.max(1, h)} fill={isProfit ? '#34d399' : '#fb7185'} opacity={isHovered ? "0.9" : "0.3"} rx="2" />
                );
              })}

              {/* Data points */}
              {chartData.map((d, i) => {
                const isProfit = d.pnl >= 0;
                const isHovered = hoveredData?.x === d.x;
                return (
                  <circle key={`dot-${i}`} cx={scaleX(d.x)} cy={scaleY(d.y)} r={isHovered ? "6" : "4"} fill="#0f172a" stroke={isProfit ? '#34d399' : '#fb7185'} strokeWidth={isHovered ? "3" : "2"} className="transition-all duration-200 cursor-pointer" onMouseEnter={() => setHoveredData(d)} onMouseLeave={() => setHoveredData(null)} />
                );
              })}
            </svg>

            {/* Tooltip */}
            {hoveredData && (
              <div 
                className="absolute z-10 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full transition-opacity duration-200 min-w-[130px]"
                style={{ left: `${Math.min(85, Math.max(15, (scaleX(hoveredData.x) / chartWidth) * 100))}%`, top: `calc(${(scaleY(hoveredData.y) / totalSvgHeight) * 100}% - 14px)` }}
              >
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  {hoveredData.label}
                </div>
                <div className={`text-sm font-bold mb-1 ${chartViewMode !== 'trades' && hoveredData.displayValue < 0 ? 'text-rose-600 dark:text-rose-400' : chartViewMode !== 'trades' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  {chartViewMode === 'trades' ? 'Ekuitas: ' : 'Net PnL: '}
                  {chartViewMode !== 'trades' && hoveredData.displayValue >= 0 ? '+' : ''}
                  {formatMoney(hoveredData.displayValue)}
                </div>
                
                {hoveredData.maValue !== null && (
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mb-1 flex items-center">
                    <Activity className="w-3 h-3 mr-1" /> MA-3: {formatMoney(hoveredData.maValue)}
                  </div>
                )}

                {chartViewMode === 'trades' && (
                  <div className={`text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 ${hoveredData.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    Bar: {hoveredData.pnl >= 0 ? '+' : ''}{formatMoney(hoveredData.pnl)}
                  </div>
                )}
                
                {hoveredData.drawdown < 0 && (
                  <div className="text-[10px] font-semibold px-2 py-1.5 rounded bg-rose-50 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 mt-1 flex flex-col gap-0.5">
                    <span className="opacity-80">Kedalaman Drawdown:</span>
                    <span>{formatMoney(hoveredData.drawdown)} ({hoveredData.drawdownPercent.toFixed(2)}%)</span>
                  </div>
                )}

                {hoveredData.recoveryInfo && (
                  <div className="text-[10px] font-semibold px-2 py-1.5 rounded bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 mt-1 flex flex-col gap-0.5 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                    <span className="opacity-80">🔥 Pulih dari lembah dalam:</span>
                    <span>{hoveredData.recoveryInfo.trades} {chartViewMode === 'trades' ? 'transaksi' : 'periode'}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between mt-4 text-[10px] sm:text-xs font-medium border-t border-slate-200 dark:border-slate-800/60 pt-4">
        <div className="text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row"><span>Gross Profit:</span> <span className="text-emerald-600 dark:text-emerald-400 sm:ml-1">{formatMoney(stats.grossProfit)}</span></div>
        <div className="text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row"><span>Gross Loss:</span> <span className="text-rose-600 dark:text-rose-400 sm:ml-1">-{formatMoney(stats.grossLoss)}</span></div>
        <div className="text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row"><span>Avg Win:</span> <span className="text-emerald-600 dark:text-emerald-400 sm:ml-1">{formatMoney(stats.avgWin)}</span></div>
        <div className="text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row"><span>Avg Loss:</span> <span className="text-rose-600 dark:text-rose-400 sm:ml-1">-{formatMoney(stats.avgLoss)}</span></div>
      </div>
    </div>
  );
}
