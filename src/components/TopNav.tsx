/**
 * Top Navigation Bar for Log Lenx.
 * Sleek glassmorphic navigation with easy view switching and sensitivity threshold access.
 */

import React from 'react';
import { UploadCloud, Activity, GitFork, PieChart, Terminal, Share2, CheckSquare, Sliders } from 'lucide-react';

interface TopNavProps {
  activeTab: 'overview' | 'incidents' | 'flowchart' | 'logs' | 'brief';
  setActiveTab: (tab: 'overview' | 'incidents' | 'flowchart' | 'logs' | 'brief') => void;
  onOpenIngest: () => void;
  onOpenConfig: () => void;
  similarityThreshold: number;
  totalLines: number;
  incidentCount: number;
  currentScenarioName: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenIngest,
  onOpenConfig,
  similarityThreshold,
  totalLines,
  incidentCount,
  currentScenarioName,
}) => {
  const sensitivityPct = Math.round(similarityThreshold * 100);

  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs shadow-sm">
            LX
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            Log Lenx.
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            · 3 A.M. Incident Triager
          </span>
        </div>
      </div>

      {/* Zone 2: Clean View Navigation */}
      <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Visual Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'incidents'
              ? 'bg-indigo-600 text-white shadow-md font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Incidents & Runbook ({incidentCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('flowchart')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'flowchart'
              ? 'bg-indigo-600 text-white shadow-md font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          <span>Cascade Flowchart</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-md font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Raw Logs ({totalLines.toLocaleString()})</span>
        </button>

        <button
          onClick={() => setActiveTab('brief')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
            activeTab === 'brief'
              ? 'bg-indigo-600 text-white shadow-md font-semibold'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Slack Brief</span>
        </button>
      </nav>

      {/* Zone 3: Configuration & Ingest Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Sensitivity Configuration Trigger */}
        <button
          onClick={onOpenConfig}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          title="Configure error grouping similarity threshold"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Threshold: <strong className="font-mono text-white">{sensitivityPct}%</strong></span>
        </button>

        {/* Change Scenario / Upload */}
        <button
          onClick={onOpenIngest}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shadow-sm"
        >
          <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
          <span>Scenarios</span>
        </button>
      </div>
    </header>
  );
};
