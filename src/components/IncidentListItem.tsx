/**
 * Clean Incident List Item for the left panel in Log Lenx.
 * Sleek glassmorphism with high contrast and readable labels.
 */

import React from 'react';
import { Incident } from '../types/log';
import { AlertCircle } from 'lucide-react';

interface IncidentListItemProps {
  incident: Incident;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const IncidentListItem: React.FC<IncidentListItemProps> = ({
  incident,
  index,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all relative ${
        isSelected
          ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-950/20 ring-1 ring-indigo-500/30'
          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700/80'
      }`}
    >
      <div className="space-y-2">
        {/* Top: Priority Number + Status + Impact */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-400">
              #{String(index + 1).padStart(2, '0')}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono text-slate-400 text-[11px]">{incident.id}</span>
            {incident.status === 'resolved' ? (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  ✓ Resolved
                </span>
              </>
            ) : incident.isLikelyTrigger ? (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-rose-400 font-semibold text-[11px] flex items-center gap-1 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  <AlertCircle className="w-3 h-3" />
                  Root Trigger
                </span>
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 tabular-nums">
            <span>Score</span>
            <span className="font-semibold text-white">{incident.impactScore}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-1">
          {incident.title}
        </h3>

        {/* Unboxed Metadata */}
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono tabular-nums pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1 text-slate-300">
            <span className="font-semibold text-white">{incident.count.toLocaleString()}</span>
            <span className="text-slate-400">logs</span>
          </div>

          <span aria-hidden="true" className="text-slate-600">·</span>

          <div className="truncate max-w-[140px] text-slate-300 font-medium" title={incident.services.join(', ')}>
            {incident.services.join(', ')}
          </div>

          <span aria-hidden="true" className="text-slate-600">·</span>

          <div className="text-slate-400">
            {incident.firstSeen.split(' ')[1] || incident.firstSeen}
          </div>
        </div>
      </div>
    </button>
  );
};
