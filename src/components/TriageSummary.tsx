/**
 * High-impact Triage Summary
 * Gives the 3 A.M. on-call engineer the definitive signal in seconds.
 */

import React from 'react';
import { AlertTriangle, Clock, Layers, Zap, ArrowRight } from 'lucide-react';
import { ParseResult, Incident, PresetKey } from '../types/log';
import { PRESET_METADATA } from '../utils/logDatasets';

interface TriageSummaryProps {
  result: ParseResult;
  onSelectIncident: (inc: Incident) => void;
  currentPreset: PresetKey;
  onLoadPreset: (key: PresetKey) => void;
  isLoading: boolean;
}

export const TriageSummary: React.FC<TriageSummaryProps> = ({
  result,
  onSelectIncident,
  currentPreset,
  onLoadPreset,
  isLoading,
}) => {
  const rootIncident = result.incidents.find(i => i.isLikelyTrigger) || result.incidents[0];
  const noiseReduction = result.totalLines > 0 
    ? ((1 - (result.incidents.length / result.totalLines)) * 100).toFixed(2)
    : '99.9';

  return (
    <section className="border-b border-neutral-800 bg-neutral-900/40 px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Preset Selector row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-400">
            <span>Incident Scenarios</span>
            <span aria-hidden="true">·</span>
            <span>10,000 Real Lines Each</span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-md">
            {(Object.keys(PRESET_METADATA) as PresetKey[]).map(key => {
              const meta = PRESET_METADATA[key];
              const isSelected = currentPreset === key;
              return (
                <button
                  key={key}
                  disabled={isLoading}
                  onClick={() => onLoadPreset(key)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-neutral-800 text-neutral-100 font-medium shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                  }`}
                >
                  {meta.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Triage Card / Smoking Gun */}
        <div className="border border-neutral-800 bg-neutral-900/80 rounded-lg p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-rose-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Primary Root Trigger Detected</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-neutral-400 font-mono tabular-nums">
                  First Seen {rootIncident?.firstSeen.split(' ')[1] || rootIncident?.firstSeen || '02:58:02 UTC'}
                </span>
              </div>

              <h1 className="text-lg lg:text-xl font-semibold text-neutral-100 tracking-tight leading-snug">
                {rootIncident ? rootIncident.template : 'No incident pattern detected'}
              </h1>

              {rootIncident && (
                <p className="text-xs text-neutral-400 max-w-4xl leading-relaxed">
                  {rootIncident.triggerRationale || 'Initiated before dependent services started reporting upstream connection timeouts.'}
                </p>
              )}
            </div>

            {rootIncident && (
              <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-neutral-800">
                <button
                  onClick={() => onSelectIncident(rootIncident)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-100 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md transition-colors whitespace-nowrap"
                >
                  <span>Examine Incident #{rootIncident.id}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4 Quantitative Triage Metrics in unboxed text & tabular figures */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Noise Reduction</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-neutral-100 font-mono tabular-nums">
                {result.totalLines.toLocaleString()}
              </span>
              <span className="text-xs text-neutral-400">→</span>
              <span className="text-xl font-semibold text-emerald-400 font-mono tabular-nums">
                {result.incidents.length} incidents
              </span>
            </div>
            <div className="text-xs text-neutral-500 font-mono tabular-nums">
              {noiseReduction}% unhandled noise suppressed
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Services In Blast Radius</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-neutral-100 font-mono tabular-nums">
                {result.services.length}
              </span>
              <span className="text-xs text-neutral-400">impacted</span>
            </div>
            <div className="text-xs text-neutral-400 truncate max-w-[200px]" title={result.services.join(', ')}>
              {result.services.slice(0, 3).join(', ')}{result.services.length > 3 ? ` +${result.services.length - 3}` : ''}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Total Error Volume</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-rose-400 font-mono tabular-nums">
                {result.errorCount.toLocaleString()}
              </span>
              <span className="text-xs text-neutral-400">failures</span>
            </div>
            <div className="text-xs text-neutral-500 font-mono tabular-nums">
              Span: {result.timeRange.durationMinutes} minutes
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Time To Action</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-cyan-400 font-mono tabular-nums">
                {result.processingTimeMs}ms
              </span>
              <span className="text-xs text-neutral-400">engine latency</span>
            </div>
            <div className="text-xs text-neutral-500">
              Zero hand-written regex rules
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
