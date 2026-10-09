/**
 * Left Sidebar Navigation matching the exact LogSleuth / Log Lenx design in the video.
 */

import React from 'react';
import { 
  Compass, 
  Terminal, 
  AlertTriangle, 
  Server, 
  Sparkles, 
  Bell, 
  Blocks, 
  Settings, 
  ChevronDown,
  Layers,
  ShieldCheck
} from 'lucide-react';

export type NavView = 'overview' | 'log_explorer' | 'incidents' | 'services' | 'ai_insights' | 'alerts' | 'integrations' | 'settings';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  incidentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  incidentCount,
}) => {
  return (
    <aside className="w-64 bg-[#0d111a] border-r border-slate-800/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div className="flex flex-col">
        {/* Workspace Brand Lockup */}
        <div className="p-4 border-b border-slate-800/70">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-900/40">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">Log Lenx.</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono px-1.5 py-0.2 rounded border border-purple-500/30">PRO</span>
            </div>
          </div>

          {/* Workspace Selector */}
          <button className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-left transition-colors text-xs">
            <div className="truncate">
              <div className="font-semibold text-slate-200 truncate">Acme workspace</div>
              <div className="text-[11px] text-slate-500">Pro plan · 5 members</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>
        </div>

        {/* WORKSPACE SECTION */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Workspace
          </div>

          <button
            onClick={() => onNavigate('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentView === 'overview'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => onNavigate('log_explorer')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentView === 'log_explorer'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Log explorer</span>
          </button>

          <button
            onClick={() => onNavigate('incidents')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentView === 'incidents'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Incidents</span>
            </div>
            {incidentCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {incidentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onNavigate('services')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentView === 'services'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Server className="w-4 h-4 text-amber-400" />
            <span>Services</span>
          </button>

          <button
            onClick={() => onNavigate('ai_insights')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentView === 'ai_insights'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI Insights</span>
          </button>
        </div>

        {/* MANAGE SECTION */}
        <div className="px-3 py-2 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
            Manage
          </div>

          <button
            onClick={() => onNavigate('alerts')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentView === 'alerts'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Alerts</span>
          </button>

          <button
            onClick={() => onNavigate('integrations')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentView === 'integrations'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Blocks className="w-4 h-4 text-indigo-400" />
            <span>Integrations</span>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentView === 'settings'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* User Profile Bar */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            JD
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-slate-200 truncate">Justin Davis</div>
            <div className="text-[11px] text-slate-500 truncate">justin@acme.io</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
