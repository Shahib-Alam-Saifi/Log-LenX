/**
 * Incident Investigation Modal / Drawer
 * Displays dynamic parameter variations, stack traces, and actionable runbooks.
 */

import React, { useState } from 'react';
import { Incident } from '../types/log';
import { X, Copy, Check, ShieldAlert, Terminal, Layers, ExternalLink, HelpCircle } from 'lucide-react';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onFilterLogs: (incidentId: string) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onFilterLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'parameters' | 'stack' | 'samples'>('overview');
  const [copied, setCopied] = useState(false);

  if (!incident) return null;

  const copyIncidentMarkdown = () => {
    const md = `## [INCIDENT REPORT] ${incident.id}
**Pattern**: \`${incident.template}\`
**Severity**: ${incident.severity} | **Impact Score**: ${incident.impactScore}/100
**Total Occurrences**: ${incident.count.toLocaleString()} (${incident.percentageOfErrors}% of all errors)
**Affected Services**: ${incident.services.join(', ')}
**First Observed**: ${incident.firstSeen}
**Last Observed**: ${incident.lastSeen}
**Duration**: ${incident.durationFormatted}

### Root Cause Analysis
${incident.isLikelyTrigger ? `🚨 **PRIMARY TRIGGER**: ${incident.triggerRationale}` : 'Downstream cascade or concurrent error pattern.'}

### Recommended Mitigations
${incident.suggestedMitigation.map(m => `- [ ] ${m}`).join('\n')}

### Sample Log Lines
\`\`\`
${incident.examples.join('\n')}
\`\`\`
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-neutral-400 font-semibold">{incident.id}</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span className={`text-xs font-medium ${
              incident.severity === 'Critical' ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {incident.severity} Priority
            </span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span className="text-xs text-neutral-400 font-mono tabular-nums">
              Impact Score {incident.impactScore}/100
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyIncidentMarkdown}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Markdown' : 'Export Brief'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Subheader / Title */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/40">
          <h2 className="text-sm md:text-base font-semibold font-mono text-neutral-100 leading-snug">
            {incident.template}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mt-2 font-mono tabular-nums">
            <span>Started {incident.firstSeen}</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>Duration {incident.durationFormatted}</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>Services: {incident.services.join(', ')}</span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>{incident.count.toLocaleString()} occurrences ({incident.percentageOfErrors}%)</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-neutral-800 bg-neutral-950/30 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 font-medium rounded-t transition-colors ${
              activeTab === 'overview'
                ? 'bg-neutral-800 text-neutral-100 border-t border-x border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Root Cause & Runbook
          </button>
          <button
            onClick={() => setActiveTab('parameters')}
            className={`px-3 py-1.5 font-medium rounded-t transition-colors ${
              activeTab === 'parameters'
                ? 'bg-neutral-800 text-neutral-100 border-t border-x border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Dynamic Parameter Variations ({incident.variableSlots.length})
          </button>
          <button
            onClick={() => setActiveTab('samples')}
            className={`px-3 py-1.5 font-medium rounded-t transition-colors ${
              activeTab === 'samples'
                ? 'bg-neutral-800 text-neutral-100 border-t border-x border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Raw Sample Entries ({incident.examples.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Likely Root Trigger Callout */}
              {incident.isLikelyTrigger && (
                <div className="border border-rose-900/60 bg-rose-950/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Identified Primary Failure Trigger</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {incident.triggerRationale}
                  </p>
                </div>
              )}

              {/* Actionable Runbook Mitigations */}
              <div className="border border-neutral-800 bg-neutral-950/40 rounded-lg p-4 space-y-3">
                <div className="text-xs font-semibold text-neutral-200">
                  Recommended On-Call Actions:
                </div>
                <ul className="space-y-2 text-xs text-neutral-300">
                  {incident.suggestedMitigation.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="font-mono text-neutral-500 text-[11px] shrink-0 mt-0.5">[{idx + 1}]</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Impact Factor Breakdown */}
              <div className="border border-neutral-800 bg-neutral-950/40 rounded-lg p-4 space-y-3">
                <div className="text-xs font-semibold text-neutral-200">
                  Impact Scoring Factors:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-neutral-900/80 p-2.5 rounded border border-neutral-800">
                    <div className="text-neutral-500 text-[11px]">Severity Factor</div>
                    <div className="text-sm font-semibold text-neutral-200 font-mono">
                      {incident.dominantLevel} (40% wt)
                    </div>
                  </div>
                  <div className="bg-neutral-900/80 p-2.5 rounded border border-neutral-800">
                    <div className="text-neutral-500 text-[11px]">Volume & Velocity</div>
                    <div className="text-sm font-semibold text-neutral-200 font-mono tabular-nums">
                      {incident.count} logs ({incident.peakVelocity}/sec)
                    </div>
                  </div>
                  <div className="bg-neutral-900/80 p-2.5 rounded border border-neutral-800">
                    <div className="text-neutral-500 text-[11px]">Cross-Service Blast</div>
                    <div className="text-sm font-semibold text-neutral-200 font-mono tabular-nums">
                      {incident.serviceCount} service(s) affected
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'parameters' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">
                Drain extracted these dynamic parameter slots across {incident.count.toLocaleString()} occurrences without requiring regex templates. Inspect which entities (UUIDs, IPs, numbers) caused failures:
              </p>

              {incident.variableSlots.length === 0 ? (
                <div className="p-4 text-xs text-neutral-500 font-mono">
                  No varying parameters: template was completely static across all occurrences.
                </div>
              ) : (
                <div className="space-y-3">
                  {incident.variableSlots.map((slot, sIdx) => (
                    <div key={sIdx} className="border border-neutral-800 rounded-lg p-3 bg-neutral-950/40 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-amber-400 font-semibold">{slot.name}</span>
                        <span className="text-neutral-500 tabular-nums">{slot.uniqueCount} unique values observed</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {slot.sampleValues.map((val, vIdx) => (
                          <span
                            key={vIdx}
                            className="text-[11px] font-mono bg-neutral-900 text-neutral-300 px-2 py-0.5 rounded border border-neutral-800 select-all"
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'samples' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400">
                Representative occurrences extracted from the cluster:
              </p>
              <div className="space-y-2">
                {incident.sampleEntries.map((entry, eIdx) => (
                  <div
                    key={eIdx}
                    className="p-2.5 bg-neutral-950 border border-neutral-800 rounded text-xs font-mono text-neutral-200 space-y-1"
                  >
                    <div className="flex items-center gap-2 text-neutral-500 text-[11px]">
                      <span>{entry.timestamp}</span>
                      <span>·</span>
                      <span className="text-neutral-400 font-medium">[{entry.service}]</span>
                      <span>·</span>
                      <span className={
                        entry.level === 'FATAL' || entry.level === 'CRITICAL' ? 'text-rose-400' :
                        entry.level === 'ERROR' ? 'text-rose-400' : 'text-amber-400'
                      }>{entry.level}</span>
                    </div>
                    <div className="text-neutral-200 select-all leading-relaxed">
                      {entry.message}
                    </div>
                    {entry.stackTrace && entry.stackTrace.length > 0 && (
                      <div className="pt-2 border-t border-neutral-900 mt-2 text-[11px] text-neutral-500 font-mono space-y-0.5">
                        <div className="text-neutral-400 text-[10px] font-sans font-semibold">Stack Trace Frames:</div>
                        {entry.stackTrace.map((frame, fIdx) => (
                          <div key={fIdx} className="text-neutral-400">{frame}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800 bg-neutral-950/70 text-xs">
          <span className="text-neutral-500 font-mono">
            Cluster {incident.id} · {incident.count} lines
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onFilterLogs(incident.id);
                onClose();
              }}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-medium transition-colors"
            >
              Filter Stream for this Incident
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
