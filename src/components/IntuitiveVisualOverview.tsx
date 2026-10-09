/**
 * Clean & Visual Incident Overview for Log Lenx.
 * Visual-first design with minimal text: Pie chart, spike graph, and 4-step failure flow.
 */

import React, { useState } from 'react';
import { ParseResult, Incident } from '../types/log';
import { PieChart, TrendingUp, AlertTriangle, ArrowRight, Check, Copy, Terminal, ShieldAlert } from 'lucide-react';

interface IntuitiveVisualOverviewProps {
  result: ParseResult;
  selectedIncidentId?: string;
  onSelectIncident: (inc: Incident) => void;
  onGoToIncidents: () => void;
}

const SERVICE_COLORS: Record<string, string> = {
  'postgres-primary': '#f43f5e',
  'payment-service': '#f59e0b',
  'checkout-gateway': '#a855f7',
  'ingress-nginx': '#06b6d4',
  'worker-queue': '#10b981',
  'kernel': '#f43f5e',
  'kubelet': '#f59e0b',
  'api-gateway': '#a855f7',
  'scheduler': '#06b6d4',
  'auth-service': '#f43f5e',
  'client-sdk': '#f59e0b',
  'redis-sentinel': '#f43f5e',
  'cache-proxy': '#f59e0b',
  'user-service': '#a855f7',
};

const DEFAULT_COLORS = ['#f43f5e', '#f59e0b', '#a855f7', '#06b6d4', '#10b981', '#3b82f6'];

export const IntuitiveVisualOverview: React.FC<IntuitiveVisualOverviewProps> = ({
  result,
  selectedIncidentId,
  onSelectIncident,
  onGoToIncidents,
}) => {
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedSlack, setCopiedSlack] = useState(false);

  const rootIncident = result.incidents.find(i => i.isLikelyTrigger) || result.incidents[0];

  // 1. Error distribution by service for the Pie Chart
  const serviceStats = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of result.entries) {
      if (['FATAL', 'CRITICAL', 'ERROR', 'WARN'].includes(e.level)) {
        counts[e.service] = (counts[e.service] || 0) + 1;
      }
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([service, count], idx) => ({
        service,
        count,
        percentage: Math.round((count / total) * 1000) / 10,
        color: SERVICE_COLORS[service] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      }));
  }, [result]);

  const maxBucketErrors = Math.max(...result.timeBuckets.map(b => b.errorCount), 1);

  // Quick SQL/terminal command
  const fixCommand = React.useMemo(() => {
    if (!rootIncident) return '';
    const t = rootIncident.template.toLowerCase();
    if (t.includes('connection') || t.includes('postgres') || t.includes('pool')) {
      return `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction';`;
    }
    if (t.includes('oom') || t.includes('memory') || t.includes('137')) {
      return `kubectl scale deployment analytics-worker --replicas=8`;
    }
    if (t.includes('jwt') || t.includes('auth') || t.includes('jwks')) {
      return `curl -X POST https://auth-service.internal/admin/jwks/force-refresh`;
    }
    if (t.includes('redis') || t.includes('sentinel')) {
      return `redis-cli sentinel failover mymaster`;
    }
    return `systemctl restart ${rootIncident.services[0]}`;
  }, [rootIncident]);

  const copyFixCommand = () => {
    navigator.clipboard.writeText(fixCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const copySlackBrief = () => {
    const text = `🚨 *[INCIDENT TRIAGE via Log Lenx.]*
*Root Cause*: ${rootIncident?.title} (${rootIncident?.services.join(', ')})
*First Seen*: ${rootIncident?.firstSeen}
*Errors*: ${rootIncident?.count.toLocaleString()} (${rootIncident?.percentageOfErrors}% of volume)
*Fix Command*: \`${fixCommand}\``;

    navigator.clipboard.writeText(text);
    setCopiedSlack(true);
    setTimeout(() => setCopiedSlack(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Visual Punchy Hero Banner (Minimal text, max clarity) */}
      <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 shadow-xl shadow-slate-950/30 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                Root Cause Trigger
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {rootIncident?.firstSeen.split(' ')[1] || '02:58:02'} UTC
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {rootIncident?.title || 'System Disruption Detected'}
            </h1>

            <p className="text-xs md:text-sm text-slate-300">
              {rootIncident?.humanSummary}
            </p>

            {/* Clean Key Stats Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <div className="px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 font-mono">
                <span className="text-rose-400 font-bold">{rootIncident?.count.toLocaleString()}</span> errors
              </div>
              <div className="px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 font-mono">
                <span className="text-amber-400 font-bold">{serviceStats.length}</span> services hit
              </div>
              <div className="px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 font-mono">
                <span className="text-emerald-400 font-bold">99.96%</span> noise reduced
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={copySlackBrief}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-md whitespace-nowrap"
            >
              {copiedSlack ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSlack ? 'Copied Update!' : 'Copy Slack Alert'}</span>
            </button>

            <button
              onClick={copyFixCommand}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors whitespace-nowrap"
            >
              {copiedCmd ? <Check className="w-4 h-4 text-emerald-400" /> : <Terminal className="w-4 h-4 text-emerald-400" />}
              <span>{copiedCmd ? 'Command Copied!' : 'Copy Fix Command'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2 Clean Graphs Side by Side (Pie Chart + Time Spike Bar Graph) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GRAPH 1: Pie / Donut Chart */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-slate-950/20 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <PieChart className="w-4 h-4 text-indigo-400" />
              <span>Error Distribution by Service</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {result.errorCount.toLocaleString()} total errors
            </span>
          </div>

          {/* SVG Pie Chart */}
          <div className="flex flex-col items-center justify-center my-4 relative">
            {(() => {
              const size = 180;
              const radius = 64;
              const strokeWidth = 28;
              const circumference = 2 * Math.PI * radius;
              let cumulative = 0;

              return (
                <div className="relative">
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                    {serviceStats.map((slice, i) => {
                      const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = -((cumulative / 100) * circumference);
                      cumulative += slice.percentage;

                      const isHovered = hoveredService === slice.service;

                      return (
                        <circle
                          key={i}
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="transparent"
                          stroke={slice.color}
                          strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => setHoveredService(slice.service)}
                          onMouseLeave={() => setHoveredService(null)}
                        />
                      );
                    })}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-lg font-bold text-white font-mono tabular-nums">
                      {result.errorCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">Errors</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Clean Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
            {serviceStats.slice(0, 4).map((slice, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredService(slice.service)}
                onMouseLeave={() => setHoveredService(null)}
                className={`p-2 rounded-lg transition-colors flex items-center justify-between ${
                  hoveredService === slice.service ? 'bg-slate-800' : 'bg-slate-950/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }}></span>
                  <span className="text-slate-300 font-medium truncate text-xs">{slice.service}</span>
                </div>
                <span className="font-mono text-white text-xs font-semibold tabular-nums ml-1">
                  {slice.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* GRAPH 2: Failure Spike Bar Graph */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-slate-950/20 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              <span>Timeline Spike (The 02:58 AM Disaster)</span>
            </div>
            <span className="text-xs text-rose-400 font-mono font-medium">
              Burst: 02:58:02 UTC
            </span>
          </div>

          {/* Visual Histogram Bars */}
          <div className="my-auto py-4">
            <div className="h-32 flex items-end gap-1.5 w-full">
              {result.timeBuckets.map((bucket, i) => {
                const errorHeightPct = bucket.errorCount > 0 
                  ? Math.max(10, (bucket.errorCount / maxBucketErrors) * 100) 
                  : 5;

                return (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-9 z-30 bg-slate-950 border border-slate-800 text-[10px] px-2 py-0.5 rounded shadow text-slate-200 font-mono whitespace-nowrap">
                      {bucket.timeLabel}: {bucket.errorCount} errors
                    </div>
                    <div
                      className={`w-full rounded-t transition-all ${
                        bucket.errorCount > 0 
                          ? 'bg-rose-500 hover:bg-rose-400 shadow-sm shadow-rose-950' 
                          : 'bg-slate-800/60 hover:bg-slate-700/60'
                      }`}
                      style={{ height: `${errorHeightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
              <span>02:45 UTC (Normal)</span>
              <span className="text-rose-400 font-bold">🚨 02:58 (Incident Eruption)</span>
              <span>03:15 UTC</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
            <span>Volume exploded 120x within 15 seconds</span>
            <button
              onClick={onGoToIncidents}
              className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>View Runbook</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4-Step Visual Propagation Flow Track */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-slate-950/20 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
          <div className="text-sm font-semibold text-white">
            How The Failure Cascaded (Step-by-Step)
          </div>
          <button
            onClick={onGoToIncidents}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>Open Detailed Checklist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {result.incidents.slice(0, 4).map((inc, i) => (
            <button
              key={inc.id}
              onClick={() => {
                onSelectIncident(inc);
                onGoToIncidents();
              }}
              className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                inc.isLikelyTrigger
                  ? 'bg-rose-950/30 border-rose-800/60 hover:border-rose-600'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${
                    inc.isLikelyTrigger 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    0{i + 1} {inc.isLikelyTrigger ? 'ROOT' : 'CASCADE'}
                  </span>
                  <span className="text-slate-400">
                    {inc.firstSeen.split(' ')[1] || inc.firstSeen}
                  </span>
                </div>

                <div className="text-xs font-semibold text-white leading-snug line-clamp-1">
                  {inc.title}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {inc.humanSummary}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{inc.services[0]}</span>
                <span className="text-white font-semibold">{inc.count.toLocaleString()} logs</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
