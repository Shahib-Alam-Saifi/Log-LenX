/**
 * Settings View matching video frames 00:24 to 00:26.
 * Contains automatic refresh toggle, default environment selector, workspace plan,
 * and custom threshold sensitivity grouping configuration.
 */

import React, { useState } from 'react';
import { ClusteringConfig } from '../../types/log';
import { Settings, Sliders, Check, ShieldCheck, ChevronDown } from 'lucide-react';

interface SettingsViewProps {
  clusteringConfig: ClusteringConfig;
  onUpdateConfig: (newConfig: ClusteringConfig) => void;
  environment: string;
  setEnvironment: (env: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  clusteringConfig,
  onUpdateConfig,
  environment,
  setEnvironment,
}) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [localSensitivity, setLocalSensitivity] = useState(
    Math.round(clusteringConfig.similarityThreshold * 100)
  );
  const [saved, setSaved] = useState(false);

  const handleSensitivityChange = (val: number) => {
    setLocalSensitivity(val);
    const updated = {
      ...clusteringConfig,
      similarityThreshold: val / 100,
    };
    onUpdateConfig(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-[#121623] border border-slate-800 rounded-xl divide-y divide-slate-800 shadow-xl">
        {/* Row 1: Automatic Refresh */}
        <div className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white">Automatic refresh</h3>
            <p className="text-xs text-slate-400">
              Keep the dashboard synchronized with incoming streaming log lines.
            </p>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              autoRefresh ? 'bg-purple-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                autoRefresh ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Row 2: Default Environment */}
        <div className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white">Default environment</h3>
            <p className="text-xs text-slate-400">
              Choose the environment shown in your workspace.
            </p>
          </div>

          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 font-semibold px-4 py-2 rounded-lg focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="Production">Production</option>
            <option value="Staging">Staging</option>
            <option value="Canary">Canary</option>
          </select>
        </div>

        {/* Row 3: Workspace */}
        <div className="p-5 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white">Workspace</h3>
            <p className="text-xs text-slate-400">
              Acme workspace · Pro plan
            </p>
          </div>

          <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors">
            Manage
          </button>
        </div>

        {/* Row 4: Error Grouping Similarity Threshold Slider */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Error Grouping Sensitivity</h3>
              </div>
              <p className="text-xs text-slate-400">
                Tune the Drain tree similarity threshold (higher = finer clusters, lower = aggressive merge).
              </p>
            </div>

            <div className="font-mono text-sm font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
              {localSensitivity}%
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <input
              type="range"
              min="35"
              max="95"
              step="5"
              value={localSensitivity}
              onChange={(e) => handleSensitivityChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>35% (Aggressive merge)</span>
              <span>65% (Balanced - Recommended)</span>
              <span>95% (Strict precision)</span>
            </div>
          </div>

          {saved && (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5 pt-1">
              <Check className="w-3.5 h-3.5" />
              <span>Sensitivity updated & logs re-clustered in real time</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
