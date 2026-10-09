/**
 * Inline Incident Detail Panel for Log Lenx.
 * Sleek glassmorphic panel with checkable action runbook & stack traces.
 */

import React, { useState } from 'react';
import { Incident } from '../types/log';
import { Copy, Check, ChevronDown, ChevronRight, Terminal, CheckCircle2, ShieldAlert } from 'lucide-react';

interface IncidentDetailPanelProps {
  incident: Incident;
  onFilterLogs: (incidentId: string) => void;
}

export const IncidentDetailPanel: React.FC<IncidentDetailPanelProps> = ({
  incident,
  onFilterLogs,
}) => {
  const [copied, setCopied] = useState(false);
  const [showStackTrace, setShowStackTrace] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyBrief = () => {
    const brief = `[INCIDENT TRIAGE] #${incident.id} - ${incident.title}
Status: Priority Incident (Score: ${incident.impactScore}/100)
Affected Services: ${incident.services.join(', ')}
Total Occurrences: ${incident.count.toLocaleString()} (${incident.percentageOfErrors}% of error volume)
Time Window: ${incident.firstSeen} to ${incident.lastSeen} (${incident.durationFormatted})

Summary:
${incident.humanSummary}

Immediate Runbook Actions:
${incident.suggestedMitigation.map((m, i) => `${i + 1}. ${m}`).join('\n')}

First Triggering Log Entry:
${incident.examples[0] || incident.template}
`;

    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const firstEntry = incident.sampleEntries[0];

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-6 flex flex-col h-full shadow-xl shadow-slate-950/20 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-800/70">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="text-white font-semibold">{incident.id}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className={incident.severity === 'Critical' ? 'text-rose-400 font-semibold' : 'text-amber-400 font-semibold'}>
              {incident.severity} Impact
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400 tabular-nums">Score {incident.impactScore}/100</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            {incident.title}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {incident.humanSummary}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyBrief}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors border border-slate-700/80 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Brief'}</span>
          </button>

          <button
            onClick={() => onFilterLogs(incident.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Grep Logs</span>
          </button>
        </div>
      </div>

      {/* Section 1: Immediate Runbook / Action Plan */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Immediate On-Call Action Checklist</span>
          </span>
          <span className="text-slate-400 text-[11px]">Click items to track resolution</span>
        </div>

        <div className="space-y-2 bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5">
          {incident.suggestedMitigation.map((step, idx) => {
            const isDone = !!checkedItems[idx];
            return (
              <label
                key={idx}
                onClick={() => toggleCheck(idx)}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-900/80 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleCheck(idx)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 focus:outline-none"
                />
                <span className={`text-xs leading-relaxed ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {step}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 2: The Smoking Gun / First Log Entry */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-rose-400" />
            <span>First Triggering Log Entry</span>
          </span>
          <span className="font-mono text-slate-400 text-[11px] tabular-nums">
            {incident.firstSeen}
          </span>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-rose-400 font-semibold">[{incident.dominantLevel}]</span>
            <span>[{incident.services.join(', ')}]</span>
          </div>
          <div className="text-slate-200 leading-relaxed break-words select-all">
            {firstEntry?.message || incident.template}
          </div>

          {/* Stack trace if present */}
          {firstEntry?.stackTrace && firstEntry.stackTrace.length > 0 && (
            <div className="pt-2 border-t border-slate-900 mt-2">
              <button
                onClick={() => setShowStackTrace(!showStackTrace)}
                className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 font-mono transition-colors"
              >
                {showStackTrace ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>{showStackTrace ? 'Hide Stack Trace' : `Show Stack Trace (${firstEntry.stackTrace.length} frames)`}</span>
              </button>

              {showStackTrace && (
                <div className="mt-2 text-[11px] text-slate-400 space-y-0.5 max-h-40 overflow-y-auto pl-2 border-l border-slate-800 select-all">
                  {firstEntry.stackTrace.map((frame, fIdx) => (
                    <div key={fIdx}>{frame}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Blast Radius & Variable Parameters */}
      <div className="space-y-2.5">
        <div className="text-xs font-semibold text-white">
          Blast Radius & Parameter Variation
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="text-slate-400 text-[11px]">Services Impacted</div>
            <div className="font-semibold text-white">
              {incident.services.join(', ')}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1">
            <div className="text-slate-400 text-[11px]">Duration / Velocity</div>
            <div className="font-mono text-white tabular-nums">
              {incident.durationFormatted} ({incident.peakVelocity} /sec)
            </div>
          </div>
        </div>

        {/* Dynamic slots */}
        {incident.variableSlots.length > 0 && (
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs">
            <div className="text-slate-400 text-[11px]">
              Varying Entities Detected in Template:
            </div>
            <div className="flex flex-wrap gap-2">
              {incident.variableSlots.map((slot, sIdx) => (
                <div key={sIdx} className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-mono">
                  <span className="text-amber-400 font-semibold">{slot.name}</span>: <span className="text-slate-300 tabular-nums">{slot.uniqueCount} unique values</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
