/**
 * Interactive Cascade Flowchart for Log Lenx.
 * Visually diagrams the exact chain of failure from root cause to upstream ingress timeouts.
 */

import React from 'react';
import { Incident } from '../types/log';
import { Database, CreditCard, Globe, Server, ArrowRight, Activity } from 'lucide-react';

interface CascadeFlowchartProps {
  incidents: Incident[];
  selectedIncidentId?: string;
  onSelectIncident: (inc: Incident) => void;
}

export const CascadeFlowchart: React.FC<CascadeFlowchartProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
}) => {
  // Sort chronologically to represent the true timeline cascade
  const flowNodes = [...incidents].sort((a, b) => a.firstSeenEpoch - b.firstSeenEpoch).slice(0, 5);

  const getNodeIcon = (serviceName: string) => {
    const s = serviceName.toLowerCase();
    if (s.includes('postgres') || s.includes('db') || s.includes('sql') || s.includes('redis')) {
      return <Database className="w-5 h-5 text-rose-400" />;
    }
    if (s.includes('payment') || s.includes('billing') || s.includes('order')) {
      return <CreditCard className="w-5 h-5 text-amber-400" />;
    }
    if (s.includes('gateway') || s.includes('ingress') || s.includes('nginx') || s.includes('api')) {
      return <Globe className="w-5 h-5 text-cyan-400" />;
    }
    return <Server className="w-5 h-5 text-violet-400" />;
  };

  const rootNode = flowNodes.find(n => n.isLikelyTrigger) || flowNodes[0];

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl shadow-slate-950/20 backdrop-blur-md">
      {/* Flowchart Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400">
            <Activity className="w-4 h-4" />
            <span>Interactive Failure Propagation Flowchart</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">
            How The Incident Cascaded Across Services
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Click any step to inspect the failure node, variable parameters, and exact runbook.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm"></span>
            <span className="text-slate-300">Root Cause Trigger</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm"></span>
            <span className="text-slate-300">Cascading Downstream Failure</span>
          </div>
        </div>
      </div>

      {/* Visual Flow Diagram */}
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {flowNodes.map((node, idx) => {
            const isRoot = node.isLikelyTrigger || idx === 0;
            const isSelected = selectedIncidentId === node.id;
            const lagSec = Math.max(0, Math.round((node.firstSeenEpoch - flowNodes[0].firstSeenEpoch) / 1000));

            return (
              <div key={node.id} className="relative flex flex-col">
                {/* Node Box */}
                <button
                  onClick={() => onSelectIncident(node)}
                  className={`flex-1 text-left p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-950/20 ring-1 ring-indigo-500/40'
                      : isRoot
                      ? 'bg-rose-950/30 border-rose-900/60 hover:border-rose-700/80 hover:bg-rose-950/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Step Badge & Timing */}
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isRoot 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          Step 0{idx + 1}
                        </span>
                        {isRoot && (
                          <span className="text-rose-400 font-semibold text-[11px] animate-pulse">
                            ROOT TRIGGER
                          </span>
                        )}
                      </div>

                      <span className="text-slate-400 text-[11px] tabular-nums font-semibold">
                        {idx === 0 ? 'T = 0s' : `+${lagSec}s`}
                      </span>
                    </div>

                    {/* Service & Title */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1">
                        {getNodeIcon(node.services[0] || 'service')}
                        <span>{node.services.join(', ')}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white leading-snug">
                        {node.title}
                      </h3>
                    </div>

                    {/* Plain English explanation */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {node.humanSummary}
                    </p>
                  </div>

                  {/* Bottom Stats */}
                  <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-xs font-mono text-slate-400 tabular-nums">
                    <div>
                      <span className="font-semibold text-white">{node.count.toLocaleString()}</span> logs
                    </div>
                    <div>
                      Score: <span className="text-white font-semibold">{node.impactScore}</span>/100
                    </div>
                  </div>
                </button>

                {/* Connecting Arrow for larger screens */}
                {idx < flowNodes.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-600 pointer-events-none">
                    <ArrowRight className="w-5 h-5 text-slate-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Causal Chain Narrative */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="text-slate-300 font-semibold">
            Root Cause Diagnosis:
          </div>
          <div className="text-slate-300 leading-relaxed">
            <strong className="text-rose-400 font-semibold">{rootNode?.title}</strong> in <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{rootNode?.services.join(', ')}</code> occurred at <span className="font-mono text-white font-semibold">{rootNode?.firstSeen}</span>, which starved payment worker threads and cascaded into {incidents.length - 1} dependent services.
          </div>
        </div>

        <button
          onClick={() => rootNode && onSelectIncident(rootNode)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg whitespace-nowrap transition-colors self-start md:self-auto shrink-0 shadow-md"
        >
          Inspect Smoking Gun (#{rootNode?.id})
        </button>
      </div>
    </div>
  );
};
