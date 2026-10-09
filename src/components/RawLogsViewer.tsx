/**
 * Raw Logs Stream Viewer with Instant Filtering & Search
 * Virtualized / high-performance chunked pagination for 10,000+ lines.
 */

import React, { useState, useMemo } from 'react';
import { LogEntry, LogLevel, Incident } from '../types/log';
import { Search, Filter, X, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface RawLogsViewerProps {
  entries: LogEntry[];
  incidents: Incident[];
  selectedClusterId?: string;
  onClearClusterFilter: () => void;
}

export const RawLogsViewer: React.FC<RawLogsViewerProps> = ({
  entries,
  incidents,
  selectedClusterId,
  onClearClusterFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [clusterFilter, setClusterFilter] = useState<string>(selectedClusterId || 'ALL');
  const [pageSize, setPageSize] = useState<number>(100);
  const [copied, setCopied] = useState(false);

  // Sync cluster filter if prop changes
  React.useEffect(() => {
    if (selectedClusterId) {
      setClusterFilter(selectedClusterId);
    }
  }, [selectedClusterId]);

  // Unique services
  const services = useMemo(() => {
    return Array.from(new Set(entries.map(e => e.service))).sort();
  }, [entries]);

  // Filtered log lines
  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (levelFilter !== 'ALL' && e.level !== levelFilter) return false;
      if (serviceFilter !== 'ALL' && e.service !== serviceFilter) return false;
      if (clusterFilter !== 'ALL' && e.clusterId !== clusterFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!e.message.toLowerCase().includes(q) && !e.service.toLowerCase().includes(q) && !e.raw.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [entries, levelFilter, serviceFilter, clusterFilter, searchTerm]);

  const displayedEntries = useMemo(() => {
    return filtered.slice(0, pageSize);
  }, [filtered, pageSize]);

  const copyVisibleLogs = () => {
    const text = displayedEntries.map(e => e.raw).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-slate-800/80 bg-slate-900/70 rounded-2xl flex flex-col h-[700px] overflow-hidden shadow-xl shadow-slate-950/20 backdrop-blur-md">
      {/* Filter Toolbar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Instant grep across 10,000 lines (e.g. timeout, 504, order_id, HikariPool)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 text-xs font-mono"
            >
              <option value="ALL">All Levels</option>
              <option value="FATAL">FATAL</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
            </select>

            {/* Service Filter */}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 text-xs font-mono"
            >
              <option value="ALL">All Services ({services.length})</option>
              {services.map(svc => (
                <option key={svc} value={svc}>{svc}</option>
              ))}
            </select>

            {/* Incident Cluster Filter */}
            <select
              value={clusterFilter}
              onChange={(e) => {
                setClusterFilter(e.target.value);
                if (e.target.value === 'ALL') onClearClusterFilter();
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 text-xs font-mono"
            >
              <option value="ALL">All Clusters</option>
              {incidents.map(inc => (
                <option key={inc.id} value={inc.id}>
                  {inc.id} ({inc.count} logs)
                </option>
              ))}
            </select>

            {/* Copy Button */}
            <button
              onClick={copyVisibleLogs}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Counter metadata */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-mono text-white tabular-nums font-semibold">
              {Math.min(displayedEntries.length, filtered.length)}
            </span>
            <span>of</span>
            <span className="font-mono text-white tabular-nums font-semibold">
              {filtered.length.toLocaleString()} matching lines
            </span>
            <span>({entries.length.toLocaleString()} total)</span>
          </div>

          {clusterFilter !== 'ALL' && (
            <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px]">
              <span>Filtered by {clusterFilter}</span>
              <button
                onClick={() => {
                  setClusterFilter('ALL');
                  onClearClusterFilter();
                }}
                className="underline hover:text-white"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stream Output */}
      <div className="flex-1 overflow-y-auto font-mono text-xs divide-y divide-slate-900 bg-slate-950/90 p-3">
        {displayedEntries.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 font-sans">
            No log entries match the current filter criteria.
          </div>
        ) : (
          displayedEntries.map((e) => (
            <div
              key={e.id}
              className="py-1 px-2 hover:bg-neutral-900/60 rounded flex items-start gap-2 text-neutral-300 leading-relaxed font-mono select-text"
            >
              <span className="text-neutral-500 tabular-nums shrink-0 text-[11px] select-none">
                {e.timestamp.split(' ')[1] || e.timestamp}
              </span>

              <span
                className={`font-semibold shrink-0 text-[11px] ${
                  e.level === 'FATAL' || e.level === 'CRITICAL'
                    ? 'text-rose-400'
                    : e.level === 'ERROR'
                    ? 'text-rose-400'
                    : e.level === 'WARN'
                    ? 'text-amber-400'
                    : 'text-neutral-500'
                }`}
              >
                [{e.level.padEnd(5)}]
              </span>

              <span className="text-neutral-400 shrink-0 text-[11px]">
                [{e.service}]
              </span>

              <span className="text-neutral-200 break-all flex-1">
                {e.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {filtered.length > pageSize && (
        <div className="p-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-400">
          <span>
            Displaying first {pageSize.toLocaleString()} lines for peak UI responsiveness.
          </span>
          <button
            onClick={() => setPageSize(prev => Math.min(prev + 500, filtered.length))}
            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-medium transition-colors"
          >
            Load Next 500 Lines
          </button>
        </div>
      )}
    </div>
  );
};
