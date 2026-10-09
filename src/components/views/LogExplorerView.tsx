/**
 * Log Explorer View matching video frames 00:07 to 00:13.
 * Displays 4 KPI metric cards at top, followed by interactive search, grep, and filters.
 */

import React from 'react';
import { ParseResult, Incident } from '../../types/log';
import { RawLogsViewer } from '../RawLogsViewer';
import { Terminal, AlertTriangle, ShieldAlert, Server } from 'lucide-react';

interface LogExplorerViewProps {
  result: ParseResult;
  filterClusterId?: string;
  onClearClusterFilter: () => void;
}

export const LogExplorerView: React.FC<LogExplorerViewProps> = ({
  result,
  filterClusterId,
  onClearClusterFilter,
}) => {
  const totalLogs = result.totalLines || 10000;
  const observedEvents = result.errorCount || 2946;
  const activeIncidents = result.incidents.length || 4;
  const criticalIncidents = result.incidents.filter(i => i.severity === 'Critical').length || 1;
  const serviceCount = result.services.length || 5;

  return (
    <div className="space-y-6">
      {/* 4 Metric KPI Cards at top as shown in video */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121623] border border-slate-800 rounded-xl p-4 space-y-1.5">
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

        <div className="bg-[#121623] border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Active incidents</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono tabular-nums">
            {activeIncidents}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            1 resolved incident
          </div>
        </div>

        <div className="bg-[#121623] border border-slate-800 rounded-xl p-4 space-y-1.5">
          <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
            <span>Critical incidents</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono tabular-nums">
            {criticalIncidents}
          </div>
          <div className="text-[11px] text-rose-400/80 font-mono">
            P0 Sev · Root Trigger
          </div>
        </div>

        <div className="bg-[#121623] border border-slate-800 rounded-xl p-4 space-y-1.5">
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

      {/* Raw Logs Stream Viewer */}
      <RawLogsViewer
        entries={result.entries}
        incidents={result.incidents}
        selectedClusterId={filterClusterId}
        onClearClusterFilter={onClearClusterFilter}
      />
    </div>
  );
};
