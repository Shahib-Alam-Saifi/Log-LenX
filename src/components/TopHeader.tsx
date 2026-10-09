/**
 * Top Navigation Header matching the video layout for Log Lenx.
 * Displays "YOUR SYSTEMS. IN FOCUS.", breadcrumbs, search, environment, sensitivity, presets, and export actions.
 */

import React, { useState } from 'react';
import { Search, ChevronDown, Bell, Download, Check, UploadCloud, Sliders, Menu } from 'lucide-react';
import { NavView } from './Sidebar';

interface TopHeaderProps {
  currentView: NavView;
  onOpenSearch?: () => void;
  environment: string;
  setEnvironment: (env: string) => void;
  onExport: () => void;
  onOpenIngest?: () => void;
  onOpenThreshold?: () => void;
  similarityThreshold?: number;
  onToggleMobileSidebar?: () => void;
}

const VIEW_TITLES: Record<NavView, { title: string; subtitle: string }> = {
  overview: {
    title: 'Observability overview',
    subtitle: 'A clear view of your stack. Every signal, one step ahead.',
  },
  log_explorer: {
    title: 'Log explorer',
    subtitle: 'Search, filter, and inspect thousands of raw events across all services.',
  },
  incidents: {
    title: 'Ranked incidents',
    subtitle: 'Prioritized issue clusters ranked by blast radius and causal precedence.',
  },
  services: {
    title: 'Services',
    subtitle: 'The pulse of your connected infrastructure.',
  },
  ai_insights: {
    title: 'AI Insights',
    subtitle: 'Turn millions of events into meaningful insights.',
  },
  alerts: {
    title: 'Alerts',
    subtitle: 'Your workspace, connected and in control.',
  },
  integrations: {
    title: 'Integrations',
    subtitle: 'Your workspace, connected and in control.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Your workspace, connected and in control.',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentView,
  environment,
  setEnvironment,
  onExport,
  onOpenIngest,
  onOpenThreshold,
  similarityThreshold = 0.65,
  onToggleMobileSidebar,
}) => {
  const [timeRange, setTimeRange] = useState('Last 24 hours');
  const [copiedExport, setCopiedExport] = useState(false);
  const info = VIEW_TITLES[currentView] || VIEW_TITLES.overview;

  const handleExportClick = () => {
    onExport();
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#0d111a]/95 backdrop-blur sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Breadcrumbs & Header Titles */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="space-y-0.5">
          <div className="text-[10px] font-mono tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Your systems. In focus.</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
            {info.title}
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {info.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls Strip */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Preset / Ingest logs button */}
        {onOpenIngest && (
          <button
            onClick={onOpenIngest}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
            title="Load 10k presets or paste custom logs"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Presets / Ingest</span>
            <span className="sm:hidden">Ingest</span>
          </button>
        )}

        {/* Sensitivity tuning button */}
        {onOpenThreshold && (
          <button
            onClick={onOpenThreshold}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors"
            title="Configure grouping threshold sensitivity"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>{Math.round(similarityThreshold * 100)}%</span>
          </button>
        )}

        {/* Global Search Bar */}
        <div className="relative hidden xl:block">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs... ⌘K"
            className="w-44 pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Environment Selector */}
        <div className="relative">
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="appearance-none bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium pl-3 pr-8 py-1.5 rounded-lg focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="Production">● Production</option>
            <option value="Staging">● Staging</option>
            <option value="Canary">● Canary</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Time Window Dropdown */}
        <div className="relative hidden lg:block">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="appearance-none bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 font-medium pl-3 pr-8 py-1.5 rounded-lg focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="Last 15 minutes">Last 15m</option>
            <option value="Last 1 hour">Last 1h</option>
            <option value="Last 24 hours">Last 24h</option>
            <option value="Last 7 days">Last 7d</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Export Action Button */}
        <button
          onClick={handleExportClick}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-purple-900/30 whitespace-nowrap"
        >
          {copiedExport ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Download className="w-3.5 h-3.5" />}
          <span>{copiedExport ? 'Copied!' : 'Export'}</span>
        </button>

        {/* Notification Bell */}
        <button className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors relative">
          <Bell className="w-3.5 h-3.5" />
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5"></span>
        </button>
      </div>
    </header>
  );
};
