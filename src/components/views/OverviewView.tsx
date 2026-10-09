/**
 * Overview View matching the exact screens from video frames 00:00 to 00:06.
 * Features: Noise to Signal Hero, 4 KPI cards, Live Log Stream terminal, Incident Intelligence,
 * Severity Distribution Donut, Ranked Incidents Table, Cascade Flowchart, and Timeline Spike.
 */

import React, { useState } from 'react';
import { ParseResult, Incident } from '../../types/log';
import { 
  Sparkles, 
  RotateCw, 
  Layers, 
  AlertTriangle, 
  Server, 
  CheckCircle2, 
  Terminal, 
  PieChart as PieIcon,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  GitBranch,
  Activity,
  Table as TableIcon
} from 'lucide-react';
import { CascadeFlowchart } from '../CascadeFlowchart';
import { TimelineSpike } from '../TimelineSpike';

interface OverviewViewProps {
  result: ParseResult;
  onAnalyzeLogs: () => void;
  isAnalyzing: boolean;
  onSelectIncident: (inc: Incident) => void;
  onOpenExplorer: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  result,
  onAnalyzeLogs,
  isAnalyzing,
  onSelectIncident,
  onOpenExplorer,
}) => {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterService, setFilterService] = useState('ALL');
  const [operationalTab, setOperationalTab] = useState<'table' | 'flowchart' | 'timeline'>('table');

  const rootIncident = result.incidents.find(i => i.isLikelyTrigger) || result.incidents[0];

  // 4 Metric cards data
  const totalLogs = result.totalLines || 10000;
  const observedEvents = result.errorCount || 2946;
  const resolvedCount = result.incidents.filter(i => i.status === 'resolved').length;
  const activeIncidents = result.incidents.filter(i => i.status !== 'resolved').length;
  const criticalIncidents = result.incidents.filter(i => i.severity === 'Critical' && i.status !== 'resolved').length;
  const serviceCount = result.services.length || 5;

  // Filtered incidents for table
  const displayedIncidents = result.incidents.filter(inc => {
    if (filterSeverity !== 'ALL' && inc.severity !== filterSeverity) return false;
    if (filterService !== 'ALL' && !inc.services.includes(filterService)) return false;
    return true;
  });

  // Calculate dynamic severity breakdown from actual parsed incidents
  const criticalCount = result.incidents
    .filter(i => i.severity === 'Critical')
    .reduce((acc, curr) => acc + curr.count, 0);
  const highCount = result.incidents
    .filter(i => i.severity === 'High')
    .reduce((acc, curr) => acc + curr.count, 0);
  const mediumCount = result.incidents
    .filter(i => i.severity === 'Medium')
    .reduce((acc, curr) => acc + curr.count, 0);
  const lowCount = Math.max(0, observedEvents - (criticalCount + highCount + mediumCount));

  const totalErrorSum = Math.max(1, observedEvents);
  const severityBreakdown = [
    { label: 'Critical', count: criticalCount, pct: Math.round((criticalCount / totalErrorSum) * 1000) / 10, color: '#ef4444' },
    { label: 'High', count: highCount, pct: Math.round((highCount / totalErrorSum) * 1000) / 10, color: '#f59e0b' },
    { label: 'Medium', count: mediumCount, pct: Math.round((mediumCount / totalErrorSum) * 1000) / 10, color: '#eab308' },
    { label: 'Low', count: lowCount, pct: Math.round((lowCount / totalErrorSum) * 1000) / 10, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER: "From noise to signal." */}
      <div className="bg-[#121623] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE {result.processingTimeMs || '184.2'}ms
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px] font-mono border border-slate-700">
                DRAIN TEMPLATE MINER
              </span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              From noise to signal.
            </h2>

            <p className="text-xs md:text-sm text-slate-400">
              {totalLogs.toLocaleString()} processed logs · {serviceCount} services · Deterministic signature clustering
            </p>
          </div>

          <button
            onClick={onAnalyzeLogs}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-purple-900/40 whitespace-nowrap self-start lg:self-center disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing Stream...' : `Analyze ${totalLogs.toLocaleString()} logs`}</span>
          </button>
        </div>
      </div>

      {/* 2. 4 METRIC CARDS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#121623] border border-slate-800/90 rounded-xl p-4 space-y-2">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Observed log events</span>
            <Terminal className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {observedEvents.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {totalLogs.toLocaleString()} logs processed
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#121623] border border-slate-800/90 rounded-xl p-4 space-y-2">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Active incidents</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {activeIncidents}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            {resolvedCount} resolved incident{resolvedCount === 1 ? '' : 's'}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#121623] border border-slate-800/90 rounded-xl p-4 space-y-2">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Critical incidents</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono tabular-nums">
            {criticalIncidents}
          </div>
          <div className="text-[11px] text-rose-400/80 font-mono">
            {criticalIncidents > 0 ? 'P0 Sev · Root Trigger' : 'All Critical Mitigated'}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#121623] border border-slate-800/90 rounded-xl p-4 space-y-2">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Observed services</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {serviceCount}
          </div>
          <div className="text-[11px] text-amber-400 font-mono">
            1 degraded service
          </div>
        </div>
      </div>

      {/* 3. MIDDLE ROW: Live Log Stream + Incident Intelligence + Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card A: LIVE LOG STREAM (5 cols) */}
        <div className="lg:col-span-5 bg-[#121623] border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Live Log Stream</span>
            </div>
            <button
              onClick={onOpenExplorer}
              className="text-[11px] text-purple-400 hover:text-purple-300 font-mono flex items-center gap-1 cursor-pointer"
            >
              <span>Explore all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-[#0b0e17] border border-slate-800/80 rounded-lg p-3 font-mono text-[11px] space-y-1.5 h-48 overflow-y-auto select-text scrollbar-thin">
            {result.entries.slice(0, 10).map((entry, idx) => (
              <div key={idx} className="leading-relaxed truncate">
                <span className="text-slate-500 mr-1.5">{entry.timestamp.split(' ')[1] || entry.timestamp}</span>
                <span className={`font-semibold mr-1.5 ${
                  entry.level === 'FATAL' || entry.level === 'CRITICAL' ? 'text-rose-400' :
                  entry.level === 'ERROR' ? 'text-rose-400' :
                  entry.level === 'WARN' ? 'text-amber-400' : 'text-slate-400'
                }`}>[{entry.level}]</span>
                <span className="text-indigo-400 mr-1.5">[{entry.service}]</span>
                <span className="text-slate-300">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card B: INCIDENT INTELLIGENCE (4 cols) */}
        <div className="lg:col-span-4 bg-[#121623] border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Incident Intelligence</span>
            </div>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
              SIMPLIFIED
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="text-slate-400 text-[11px]">
              Drain template miner extracted {result.incidents.length} core error signatures from {totalLogs.toLocaleString()} lines:
            </div>
            {rootIncident && (
              <div className={`border rounded-lg p-3 space-y-1 ${
                rootIncident.status === 'resolved' 
                  ? 'bg-emerald-950/20 border-emerald-900/50' 
                  : 'bg-rose-950/30 border-rose-900/60'
              }`}>
                <div className={`text-[11px] font-bold flex items-center justify-between ${
                  rootIncident.status === 'resolved' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {rootIncident.status === 'resolved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                    <span>{rootIncident.status === 'resolved' ? 'Root Trigger Mitigated' : `Smoking Gun: ${rootIncident.services[0]}`}</span>
                  </div>
                  {rootIncident.status === 'resolved' && (
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">RESOLVED</span>
                  )}
                </div>
                <div className="text-xs font-semibold text-white leading-snug line-clamp-2">
                  {rootIncident.title}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Started at {rootIncident.firstSeen.split(' ')[1] || rootIncident.firstSeen}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => rootIncident && onSelectIncident(rootIncident)}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{rootIncident?.status === 'resolved' ? 'View Resolution & Runbook' : 'Investigate & Resolve Error'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card C: SEVERITY DISTRIBUTION DONUT (3 cols) */}
        <div className="lg:col-span-3 bg-[#121623] border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Severity Distribution
            </div>
            <PieIcon className="w-3.5 h-3.5 text-indigo-400" />
          </div>

          {/* SVG Donut */}
          <div className="flex items-center justify-center my-1 relative">
            {(() => {
              const size = 120;
              const radius = 45;
              const strokeWidth = 20;
              const circumference = 2 * Math.PI * radius;
              let cumulative = 0;

              return (
                <div className="relative">
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                    {severityBreakdown.map((slice, i) => {
                      const strokeDasharray = `${(slice.pct / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((cumulative / 100) * circumference);
                      cumulative += slice.pct;

                      return (
                        <circle
                          key={i}
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth={strokeWidth}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm font-bold text-white font-mono">
                      {observedEvents.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase">Errors</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-400">
            {severityBreakdown.map((s, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                <span>{s.label}:</span>
                <span className="text-slate-200 font-semibold">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. OPERATIONAL SECTION: Ranked Incidents Table, Flowchart & Timeline Switcher */}
      <div className="space-y-4">
        {/* Sub-navigation pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOperationalTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                operationalTab === 'table'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Ranked Incidents Table ({result.incidents.length})</span>
            </button>

            <button
              onClick={() => setOperationalTab('flowchart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                operationalTab === 'flowchart'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cascade Flowchart</span>
            </button>

            <button
              onClick={() => setOperationalTab('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                operationalTab === 'timeline'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Timeline Spike Histogram</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            <span>Click any node or row to inspect root cause runbook</span>
          </div>
        </div>

        {/* Tab A: Ranked Incidents Table */}
        {operationalTab === 'table' && (
          <div className="bg-[#121623] border border-slate-800/90 rounded-xl overflow-hidden shadow-xl space-y-0">
            {/* Table Header Row */}
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Ranked incidents</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px] border border-purple-500/30">
                    {result.incidents.length} active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  The signals that need your attention
                </p>
              </div>

              {/* Filter Dropdowns */}
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="ALL">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>

                <select
                  value={filterService}
                  onChange={(e) => setFilterService(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="ALL">All Services</option>
                  {result.services.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* The Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0e121c] text-[10px] font-mono uppercase text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Incident</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Events</th>
                    <th className="py-3 px-4 text-right">Last seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {displayedIncidents.map((inc, idx) => {
                    const isRoot = inc.isLikelyTrigger || idx === 0;

                    return (
                      <tr
                        key={inc.id}
                        onClick={() => onSelectIncident(inc)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 font-bold text-slate-400 group-hover:text-white">
                          0{idx + 1}
                        </td>

                        {/* Incident Title & Pattern */}
                        <td className="py-3.5 px-4 font-sans">
                          <div className="font-bold text-slate-100 group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                            {isRoot && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            )}
                            <span>{inc.title}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 truncate max-w-md">
                            {inc.template}
                          </div>
                        </td>

                        {/* Severity Badge */}
                        <td className="py-3.5 px-4 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block border ${
                            inc.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                            inc.severity === 'High' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                            inc.severity === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' :
                            'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}>
                            {inc.severity}
                          </span>
                        </td>

                        {/* Service */}
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
                            {inc.services.join(', ')}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {inc.status === 'resolved' ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-sans font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Resolved
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[11px] font-sans font-medium ${
                              isRoot ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' :
                              inc.severity === 'Critical' ? 'text-amber-400 bg-amber-500/10' :
                              'text-purple-400 bg-purple-500/10'
                            }`}>
                              {isRoot ? 'Root Trigger' : 'Active'}
                            </span>
                          )}
                        </td>

                        {/* Events Count */}
                        <td className="py-3.5 px-4 text-right font-bold text-slate-200 tabular-nums">
                          {inc.count.toLocaleString()}
                        </td>

                        {/* Last Seen */}
                        <td className="py-3.5 px-4 text-right text-slate-500 tabular-nums text-[11px]">
                          {idx === 0 ? '2m ago' : idx === 1 ? '5m ago' : idx === 2 ? '14m ago' : idx === 3 ? '22m ago' : '45m ago'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab B: Cascade Flowchart */}
        {operationalTab === 'flowchart' && (
          <CascadeFlowchart
            incidents={result.incidents}
            onSelectIncident={onSelectIncident}
          />
        )}

        {/* Tab C: Timeline Spike Histogram */}
        {operationalTab === 'timeline' && (
          <TimelineSpike
            timeBuckets={result.timeBuckets}
            incidents={result.incidents}
            onSelectIncident={onSelectIncident}
          />
        )}
      </div>
    </div>
  );
};
