/**
 * Ranked Incident Card
 * Adheres strictly to Zero-Pill & Metadata Discipline (unboxed text with typographic separators).
 */

import React, { useState } from 'react';
import { Incident } from '../types/log';
import { AlertCircle, Clock, Server, Activity, ChevronRight, Copy, Check, FileText } from 'lucide-react';

interface IncidentCardProps {
  incident: Incident;
  rank: number;
  onInspect: (incident: Incident) => void;
  onFilterLogs: (incidentId: string) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  rank,
  onInspect,
  onFilterLogs,
}) => {
  const [copied, setCopied] = useState(false);

  const copyBrief = (e: React.MouseEvent) => {
    e.stopPropagation();
    const brief = `[INCIDENT TRIAGE] #${incident.id} (Rank ${rank})
Impact Score: ${incident.impactScore}/100
Pattern: ${incident.template}
Occurrences: ${incident.count.toLocaleString()} (${incident.percentageOfErrors}% of errors)
Services: ${incident.services.join(', ')}
Time Window: ${incident.firstSeen} to ${incident.lastSeen} (Duration: ${incident.durationFormatted})
${incident.isLikelyTrigger ? `🚨 LIKELY ROOT TRIGGER: ${incident.triggerRationale}\n` : ''}
Suggested Runbook Action:
${incident.suggestedMitigation.map(s => `- ${s}`).join('\n')}`;

    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split template tokens to visually differentiate static text vs dynamic wildcards (<*>, <UUID>, etc.)
  const renderTemplateTokens = () => {
    return incident.patternTokens.map((token, idx) => {
      const isVar = token.startsWith('<') && token.endsWith('>');
      if (isVar) {
        return (
          <span
            key={idx}
            className="text-amber-400 font-mono text-[11px] bg-amber-950/40 px-1 py-0.5 rounded border border-amber-900/40 inline-block mx-0.5"
          >
            {token}
          </span>
        );
      }
      return <span key={idx}> {token}</span>;
    });
  };

  return (
    <article
      onClick={() => onInspect(incident)}
      className={`border rounded-lg p-5 transition-all cursor-pointer relative ${
        incident.isLikelyTrigger
          ? 'border-neutral-700 bg-neutral-900/90 hover:border-neutral-600 shadow-sm'
          : 'border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900/70'
      }`}
    >
      <div className="space-y-3.5">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Unboxed Metadata Header (NO PILLS) */}
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200">
              Priority #{rank}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-neutral-300">{incident.id}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                incident.severity === 'Critical'
                  ? 'text-rose-400 font-medium'
                  : incident.severity === 'High'
                  ? 'text-amber-400 font-medium'
                  : 'text-neutral-400'
              }
            >
              {incident.severity} Severity
            </span>
            {incident.isLikelyTrigger && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-rose-400 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Likely Root Trigger
                </span>
              </>
            )}
          </div>

          {/* Impact Score Display */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500">Impact Score</span>
            <span className="font-mono tabular-nums font-semibold text-neutral-100 text-sm">
              {incident.impactScore}
              <span className="text-neutral-500 font-normal text-xs">/100</span>
            </span>
          </div>
        </div>

        {/* Template Headline */}
        <div>
          <h2 className="text-sm md:text-base font-medium text-neutral-100 font-mono leading-relaxed break-words">
            {renderTemplateTokens()}
          </h2>

          {incident.isLikelyTrigger && (
            <p className="text-xs text-rose-300/90 mt-2 bg-rose-950/20 border border-rose-900/40 rounded p-2.5 leading-relaxed">
              <strong>Causal Sequence:</strong> {incident.triggerRationale}
            </p>
          )}
        </div>

        {/* Unboxed Core Metadata Strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-400 pt-1 border-t border-neutral-800/80">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-neutral-200 font-mono tabular-nums font-semibold">
              {incident.count.toLocaleString()}
            </span>
            <span>logs ({incident.percentageOfErrors}%)</span>
          </div>

          <span aria-hidden="true" className="text-neutral-700">·</span>

          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-neutral-500" />
            <span>Services:</span>
            <span className="text-neutral-200 font-medium">
              {incident.services.join(', ')}
            </span>
          </div>

          <span aria-hidden="true" className="text-neutral-700">·</span>

          <div className="flex items-center gap-1.5 font-mono tabular-nums">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span>Started:</span>
            <span className="text-neutral-300">{incident.firstSeen.split(' ')[1] || incident.firstSeen}</span>
            <span>(ran for {incident.durationFormatted})</span>
          </div>
        </div>

        {/* Representative Sample Line */}
        {incident.examples[0] && (
          <div className="bg-neutral-950/70 border border-neutral-800/80 rounded p-2 text-xs font-mono text-neutral-300 truncate">
            <span className="text-neutral-500 select-none mr-2">SAMPLE:</span>
            {incident.examples[0]}
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={copyBrief}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Brief'}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onFilterLogs(incident.id);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Grep Cluster Logs</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-xs font-medium text-neutral-300 hover:text-white">
            <span>Investigate Parameters</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </article>
  );
};
