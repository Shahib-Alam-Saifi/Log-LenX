/**
 * Root Cause Hero Banner for Log Lenx.
 * Designed to provide instant clarity at 3 A.M. without sensory overload.
 */

import React, { useState } from 'react';
import { Incident } from '../types/log';
import { AlertTriangle, Copy, Check, ArrowRight, ShieldCheck, Clock, Server } from 'lucide-react';

interface RootCauseHeroProps {
  rootIncident: Incident | undefined;
  totalLines: number;
  incidentCount: number;
  onSelectIncident: (inc: Incident) => void;
}

export const RootCauseHero: React.FC<RootCauseHeroProps> = ({
  rootIncident,
  totalLines,
  incidentCount,
  onSelectIncident,
}) => {
  const [copied, setCopied] = useState(false);

  if (!rootIncident) return null;

  const copyQuickSlackUpdate = () => {
    const text = `🚨 *[3 A.M. INCIDENT TRIAGED via Log Lenx.]*
*Root Cause*: ${rootIncident.title} (${rootIncident.id})
*Summary*: ${rootIncident.humanSummary}
*First Observed*: ${rootIncident.firstSeen} in \`${rootIncident.services.join(', ')}\`
*Blast Radius*: ${rootIncident.services.length} services impacted · ${rootIncident.count.toLocaleString()} errors (${rootIncident.percentageOfErrors}% of volume)
*Immediate Runbook Steps*:
${rootIncident.suggestedMitigation.map((m, i) => `${i + 1}. ${m}`).join('\n')}
*Raw Stream Analyzed*: ${totalLines.toLocaleString()} lines condensed to ${incidentCount} incidents.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-6 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: What broke & Why */}
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
            <span>Root Cause Trigger Found</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="text-neutral-400 font-mono tabular-nums">
              Started at {rootIncident.firstSeen.split(' ')[1] || rootIncident.firstSeen}
            </span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="text-neutral-400 font-mono">
              Service: {rootIncident.services.join(', ')}
            </span>
          </div>

          <h1 className="text-xl lg:text-2xl font-bold text-neutral-100 tracking-tight">
            {rootIncident.title}
          </h1>

          <p className="text-sm text-neutral-300 leading-relaxed">
            {rootIncident.humanSummary}
          </p>

          {/* Minimal Key Stats */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-neutral-200 font-semibold tabular-nums">
                {rootIncident.count.toLocaleString()}
              </span>
              <span>errors</span>
            </div>

            <span aria-hidden="true" className="text-neutral-700">·</span>

            <div className="flex items-center gap-1.5">
              <span className="font-mono text-neutral-200 font-semibold tabular-nums">
                {rootIncident.percentageOfErrors}%
              </span>
              <span>of error traffic</span>
            </div>

            <span aria-hidden="true" className="text-neutral-700">·</span>

            <div className="flex items-center gap-1.5">
              <span className="text-neutral-300">
                10,000 raw lines → {incidentCount} actionable incidents
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-row lg:flex-col items-stretch gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
          <button
            onClick={copyQuickSlackUpdate}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-white text-neutral-900 font-medium text-xs rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Slack Incident Update'}</span>
          </button>

          <button
            onClick={() => onSelectIncident(rootIncident)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700/80 transition-colors whitespace-nowrap"
          >
            <span>View Full Root Cause & Fix</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
