/**
 * Clustering Threshold & Grouping Sensitivity Configuration Modal
 * Allows users to tune how aggressively or strictly similar error logs are clustered.
 */

import React, { useState } from 'react';
import { ClusteringConfig, DEFAULT_CLUSTERING_CONFIG } from '../types/log';
import { X, Sliders, Check, RotateCcw, Sparkles, Layers, Info } from 'lucide-react';

interface ThresholdConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ClusteringConfig;
  onApplyConfig: (newConfig: ClusteringConfig) => void;
  totalErrors: number;
  currentIncidentCount: number;
}

export const ThresholdConfigModal: React.FC<ThresholdConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onApplyConfig,
  totalErrors,
  currentIncidentCount,
}) => {
  const [localConfig, setLocalConfig] = useState<ClusteringConfig>({ ...config });

  // Sync when opened
  React.useEffect(() => {
    if (isOpen) {
      setLocalConfig({ ...config });
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyConfig(localConfig);
    onClose();
  };

  const handleReset = () => {
    setLocalConfig({ ...DEFAULT_CLUSTERING_CONFIG });
  };

  const sensitivityPercent = Math.round(localConfig.similarityThreshold * 100);

  // Derive human explanation of current sensitivity
  const getSensitivityDescription = () => {
    if (localConfig.similarityThreshold < 0.58) {
      return {
        level: 'Aggressive Merging (Low Strictness)',
        badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        explanation: 'Merges logs with broader structural divergence into fewer, high-level incident buckets. Ideal for noisy logs with frequent template variations.',
        projectedIncidents: 'Fewer, broader clusters (~2-3 incidents)',
      };
    }
    if (localConfig.similarityThreshold <= 0.75) {
      return {
        level: 'Balanced Triage (Recommended)',
        badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        explanation: 'Optimal balance for on-call incidents. Automatically parameterizes dynamic IDs and timestamps while preserving unique error causes.',
        projectedIncidents: `Balanced clustering (Current: ${currentIncidentCount} incidents)`,
      };
    }
    return {
      level: 'Strict Precision (High Strictness)',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      explanation: 'Only messages with nearly identical token wording are grouped together. Produces more fine-grained incidents to isolate subtle error variations.',
      projectedIncidents: 'More granular clusters (~6-12 incidents)',
    };
  };

  const desc = getSensitivityDescription();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Error Grouping Sensitivity</h3>
              <p className="text-xs text-slate-400">
                Define the similarity threshold used to cluster similar log errors.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Main Sensitivity Slider */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white">Similarity Threshold</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Percentage of invariant tokens required to match an existing incident cluster
                </span>
              </div>
              <div className="font-mono text-lg font-bold text-indigo-400 tabular-nums">
                {sensitivityPercent}%
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="35"
              max="95"
              step="5"
              value={sensitivityPercent}
              onChange={(e) => {
                const val = parseFloat(e.target.value) / 100;
                setLocalConfig(prev => ({ ...prev, similarityThreshold: val }));
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />

            {/* Slider Ticks */}
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>35% (Aggressive)</span>
              <span>65% (Default)</span>
              <span>95% (Strict)</span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setLocalConfig(prev => ({ ...prev, similarityThreshold: 0.50 }))}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  sensitivityPercent === 50
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Aggressive (50%)
              </button>
              <button
                type="button"
                onClick={() => setLocalConfig(prev => ({ ...prev, similarityThreshold: 0.65 }))}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  sensitivityPercent === 65
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Balanced (65%)
              </button>
              <button
                type="button"
                onClick={() => setLocalConfig(prev => ({ ...prev, similarityThreshold: 0.85 }))}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  sensitivityPercent === 85
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Strict (85%)
              </button>
            </div>

            {/* Live Explanatory Badge */}
            <div className="pt-2 border-t border-slate-900 mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${desc.badgeColor}`}>
                  {desc.level}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {desc.projectedIncidents}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                {desc.explanation}
              </p>
            </div>
          </div>

          {/* Advanced Clustering Tuning */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Token Normalization & Wildcard Slots</span>
            </span>
            <p className="text-xs text-slate-400">
              Choose which dynamic operational values should be automatically replaced with semantic wildcard slots (`&lt;UUID&gt;`, `&lt;IP&gt;`, etc.) to prevent cluster fragmentation:
            </p>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={localConfig.normalizeUuids}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, normalizeUuids: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 focus:outline-none"
                />
                <div>
                  <span className="text-white font-medium block">UUID Tokens</span>
                  <span className="text-[11px] text-slate-500 font-mono">&lt;UUID&gt; IDs</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={localConfig.normalizeIps}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, normalizeIps: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 focus:outline-none"
                />
                <div>
                  <span className="text-white font-medium block">IP Addresses</span>
                  <span className="text-[11px] text-slate-500 font-mono">&lt;IP&gt; hosts</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={localConfig.normalizeNumbers}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, normalizeNumbers: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 focus:outline-none"
                />
                <div>
                  <span className="text-white font-medium block">Numbers & Units</span>
                  <span className="text-[11px] text-slate-500 font-mono">&lt;NUM&gt; (ms, kb)</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={localConfig.normalizeHex}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, normalizeHex: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0 focus:outline-none"
                />
                <div>
                  <span className="text-white font-medium block">Hex Hashes</span>
                  <span className="text-[11px] text-slate-500 font-mono">&lt;HEX&gt; hashes</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80 text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply & Re-Cluster Logs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
