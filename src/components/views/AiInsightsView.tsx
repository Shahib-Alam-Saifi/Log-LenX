/**
 * AI Insights View matching video frames 00:18 to 00:19.
 * Provides automated incident intelligence, causal chain diagnosis, and explain insights dialog.
 */

import React, { useState } from 'react';
import { ParseResult, Incident } from '../../types/log';
import { Sparkles, ArrowRight, ShieldAlert, CheckCircle2, Copy, Check, Terminal } from 'lucide-react';

interface AiInsightsViewProps {
  result: ParseResult;
  onSelectIncident: (inc: Incident) => void;
}

export const AiInsightsView: React.FC<AiInsightsViewProps> = ({
  result,
  onSelectIncident,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [copied, setCopied] = useState(false);

  const root = result.incidents.find(i => i.isLikelyTrigger) || result.incidents[0];

  const copyExecutiveSummary = () => {
    const text = `[LOGSLEUTH AI INSIGHTS]
Root Cause Analysis:
- Smoking Gun: ${root?.title} (${root?.services.join(', ')})
- First Seen: ${root?.firstSeen}
- Summary: ${root?.humanSummary}
- Causal Chain: ${root?.triggerRationale}
- Immediate Fix: ${root?.suggestedMitigation[0]}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Incident Intelligence Banner */}
      <div className="bg-[#121623] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Incident intelligence</span>
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded border border-purple-500/30">
                SIMPLIFIED
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              System explanation is available inside records. Live telemetry and automated analysis are connected.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-purple-900/30 whitespace-nowrap"
            >
              {showExplanation ? 'Hide Explanation' : 'Explain insights'}
            </button>
            <button
              onClick={copyExecutiveSummary}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Explanation Box */}
        {showExplanation && (
          <div className="mt-5 pt-5 border-t border-slate-800/80 space-y-3 font-sans text-xs text-slate-300 leading-relaxed animate-in fade-in duration-150">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Automated Causal Synthesis</span>
              </div>
              <p>
                At <strong>{root?.firstSeen}</strong>, the <code>{root?.services[0]}</code> component experienced connection starvation. Because upstream pools lacked circuit breaker thresholds, subsequent requests from <strong>checkout-gateway</strong> stalled, causing 3,840 cascading 504 timeouts.
              </p>
              <div className="pt-2 text-emerald-400 font-mono">
                Suggested action: {root?.suggestedMitigation[0]}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Ranked Incidents Cards list */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Discovered Pattern Clusters
        </div>

        {result.incidents.map((inc, idx) => (
          <div
            key={inc.id}
            onClick={() => onSelectIncident(inc)}
            className="bg-[#121623] border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-slate-500">#{String(idx + 1).padStart(2, '0')}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  inc.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400' :
                  inc.severity === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {inc.severity}
                </span>
                <span className="font-mono text-slate-400">[{inc.services.join(', ')}]</span>
              </div>

              <div className="text-sm font-bold text-white">
                {inc.title}
              </div>

              <p className="text-xs text-slate-400 max-w-2xl">
                {inc.humanSummary}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0 font-mono text-xs text-slate-400">
              <div className="text-right">
                <div className="font-bold text-white">{inc.count.toLocaleString()}</div>
                <div className="text-[11px] text-slate-500">occurrences</div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
