/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar, NavView } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { OverviewView } from './components/views/OverviewView';
import { LogExplorerView } from './components/views/LogExplorerView';
import { IncidentsView } from './components/views/IncidentsView';
import { ServicesView } from './components/views/ServicesView';
import { AiInsightsView } from './components/views/AiInsightsView';
import { AlertsView } from './components/views/AlertsView';
import { IntegrationsView } from './components/views/IntegrationsView';
import { SettingsView } from './components/views/SettingsView';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { ThresholdConfigModal } from './components/ThresholdConfigModal';
import { LogIngestionModal } from './components/LogIngestionModal';
import { ParseResult, Incident, PresetKey, ClusteringConfig, DEFAULT_CLUSTERING_CONFIG } from './types/log';
import { generatePresetLogs } from './utils/logDatasets';
import { apiClient } from './utils/apiClient';
import { processLogsAsync } from './utils/logAnalyzer';
import { RefreshCw, X, Zap, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<NavView>('overview');
  const [environment, setEnvironment] = useState<string>('Production');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progressText, setProgressText] = useState<string>('Initializing Log Lenx engine...');
  const [progressPercent, setProgressPercent] = useState<number>(10);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(true);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [clusteringConfig, setClusteringConfig] = useState<ClusteringConfig>(DEFAULT_CLUSTERING_CONFIG);
  const [filterClusterId, setFilterClusterId] = useState<string | undefined>(undefined);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Keep a reference to current raw log stream so re-clustering with new threshold is instant
  const currentRawLogsRef = useRef<string>('');

  // Primary analysis function (calls backend API with client fallback)
  const analyzeLogText = useCallback(async (
    rawText: string,
    presetKey?: PresetKey,
    configToUse: ClusteringConfig = clusteringConfig
  ) => {
    setIsLoading(true);
    setProgressPercent(20);
    setProgressText('Processing 10,000 log lines...');
    currentRawLogsRef.current = rawText;

    try {
      setProgressPercent(50);
      setProgressText('Clustering error signatures via Drain algorithm...');
      
      const result = await apiClient.analyzeLogs({
        rawText,
        presetKey,
        config: configToUse,
      });

      setProgressPercent(90);
      setProgressText('Computing blast radius & causal ranking...');
      
      setParseResult(result);
      
      const root = result.incidents.find(i => i.isLikelyTrigger) || result.incidents[0];
      if (root) {
        setSelectedIncident(root);
        if (root.status !== 'resolved') {
          setIsDetailModalOpen(true);
        }
      }
    } catch (err) {
      console.warn('Backend call failed, falling back to local worker', err);
      try {
        const localResult = await processLogsAsync(
          rawText,
          (pct, msg) => {
            setProgressPercent(pct);
            setProgressText(msg);
          },
          configToUse
        );
        setParseResult(localResult);
        const root = localResult.incidents.find(i => i.isLikelyTrigger) || localResult.incidents[0];
        if (root) {
          setSelectedIncident(root);
          if (root.status !== 'resolved') {
            setIsDetailModalOpen(true);
          }
        }
      } catch (innerErr) {
        console.error('Fatal parsing error', innerErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, [clusteringConfig]);

  // Initial load on mount
  useEffect(() => {
    const raw = generatePresetLogs('payment_cascade', 10000);
    analyzeLogText(raw, 'payment_cascade', DEFAULT_CLUSTERING_CONFIG);
  }, []);

  // Handle re-clustering when user tunes sensitivity threshold
  const handleApplyThresholdConfig = async (newConfig: ClusteringConfig) => {
    setClusteringConfig(newConfig);
    if (currentRawLogsRef.current) {
      await analyzeLogText(currentRawLogsRef.current, undefined, newConfig);
    }
  };

  // Filter logs for explorer
  const handleFilterLogs = (incidentId: string) => {
    setFilterClusterId(incidentId);
    setCurrentView('log_explorer');
    setIsDetailModalOpen(false);
  };

  const handleFilterServiceLogs = (serviceName: string) => {
    setCurrentView('log_explorer');
    // will view logs
  };

  const handleExport = async () => {
    const report = await apiClient.getExportReport();
    const str = JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(str);
  };

  // Handle resolving an incident
  const handleResolveIncident = async (incidentId: string, notes?: string) => {
    try {
      await apiClient.resolveIncident(incidentId, notes);
    } catch (e) {
      console.warn('Backend resolve API error', e);
    }

    setParseResult((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        incidents: prev.incidents.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
              resolvedBy: 'On-Call SRE',
              resolutionNotes: notes,
            };
          }
          return inc;
        }),
      };
    });

    setSelectedIncident((prev) => {
      if (prev && prev.id === incidentId) {
        return {
          ...prev,
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          resolvedBy: 'On-Call SRE',
          resolutionNotes: notes,
        };
      }
      return prev;
    });
  };

  // Handle reopening an incident
  const handleReopenIncident = async (incidentId: string) => {
    try {
      await apiClient.reopenIncident(incidentId);
    } catch (e) {
      console.warn('Backend reopen API error', e);
    }

    setParseResult((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        incidents: prev.incidents.map((inc) => {
          if (inc.id === incidentId) {
            return {
              ...inc,
              status: inc.isLikelyTrigger ? 'investigating' : 'active',
              resolvedAt: undefined,
              resolvedBy: undefined,
              resolutionNotes: undefined,
            };
          }
          return inc;
        }),
      };
    });

    setSelectedIncident((prev) => {
      if (prev && prev.id === incidentId) {
        return {
          ...prev,
          status: prev.isLikelyTrigger ? 'investigating' : 'active',
          resolvedAt: undefined,
          resolvedBy: undefined,
          resolutionNotes: undefined,
        };
      }
      return prev;
    });
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Escape') {
        setIsIngestModalOpen(false);
        setIsConfigModalOpen(false);
        setIsDetailModalOpen(false);
        setMobileSidebarOpen(false);
      } else if (e.key === '1') {
        setCurrentView('overview');
      } else if (e.key === '2') {
        setCurrentView('log_explorer');
      } else if (e.key === '3') {
        setCurrentView('incidents');
      } else if (e.key === '4') {
        setCurrentView('services');
      } else if (e.key === '5') {
        setCurrentView('ai_insights');
      } else if (e.key === '6') {
        setCurrentView('alerts');
      } else if (e.key === '7') {
        setCurrentView('integrations');
      } else if (e.key === '8') {
        setCurrentView('settings');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0e17] text-slate-100 flex flex-row font-sans selection:bg-purple-900/60 selection:text-purple-200 antialiased">
      {/* Desktop Left Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          incidentCount={parseResult?.incidents.length || 0}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 bg-[#0d111a] h-full shadow-2xl flex flex-col">
            <div className="flex justify-end p-2 border-b border-slate-800">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar
              currentView={currentView}
              onNavigate={(v) => {
                setCurrentView(v);
                setMobileSidebarOpen(false);
              }}
              incidentCount={parseResult?.incidents.length || 0}
            />
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <TopHeader
          currentView={currentView}
          environment={environment}
          setEnvironment={setEnvironment}
          onExport={handleExport}
          onOpenIngest={() => setIsIngestModalOpen(true)}
          onOpenThreshold={() => setIsConfigModalOpen(true)}
          similarityThreshold={clusteringConfig.similarityThreshold}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Global Processing / Progress Banner */}
        {isLoading && (
          <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs backdrop-blur-md sticky top-[69px] z-20">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span className="font-medium text-slate-200">{progressText}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-28 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-mono text-slate-400 tabular-nums">{progressPercent}%</span>
            </div>
          </div>
        )}

        {/* Emergency Active Incident Banner & Quick Remediation Bar */}
        {parseResult && selectedIncident && (
          <div className={`border-b px-6 py-2.5 transition-all text-xs flex flex-wrap items-center justify-between gap-3 sticky top-[69px] z-20 backdrop-blur-md ${
            selectedIncident.status === 'resolved'
              ? 'bg-emerald-950/70 border-emerald-900/60 text-emerald-200'
              : 'bg-gradient-to-r from-rose-950/80 via-red-950/70 to-slate-900/90 border-rose-900/70 text-rose-200'
          }`}>
            <div className="flex items-center gap-3">
              {selectedIncident.status === 'resolved' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[11px] bg-black/40">
                  {selectedIncident.id}
                </span>
                <span className="font-semibold text-white">
                  {selectedIncident.status === 'resolved'
                    ? 'Incident Mitigated: Connection pool restored'
                    : selectedIncident.title}
                </span>
                <span className="text-slate-400 hidden sm:inline">·</span>
                <span className="text-slate-300 font-mono text-[11px] truncate max-w-md hidden md:inline">
                  {selectedIncident.services[0]}: remaining connection slots are reserved for non-replication superuser connections
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedIncident.status !== 'resolved' ? (
                <>
                  <button
                    onClick={() => handleResolveIncident(selectedIncident.id, 'Fast-path 1-click resolution')}
                    className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 text-[11px] cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Instant Resolve</span>
                  </button>
                  <button
                    onClick={() => setIsDetailModalOpen(true)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Runbook</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                    ✔ Nominal Latency (1.4ms)
                  </span>
                  <button
                    onClick={() => setIsDetailModalOpen(true)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-[11px] cursor-pointer"
                  >
                    Audit Details
                  </button>
                  <button
                    onClick={() => handleReopenIncident(selectedIncident.id)}
                    className="px-2.5 py-1 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-[11px] cursor-pointer"
                  >
                    Reopen
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Views */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {parseResult ? (
            <>
              {currentView === 'overview' && (
                <OverviewView
                  result={parseResult}
                  onAnalyzeLogs={() => analyzeLogText(currentRawLogsRef.current || generatePresetLogs('payment_cascade', 10000))}
                  isAnalyzing={isLoading}
                  onSelectIncident={(inc) => {
                    setSelectedIncident(inc);
                    setIsDetailModalOpen(true);
                  }}
                  onOpenExplorer={() => setCurrentView('log_explorer')}
                />
              )}

              {currentView === 'log_explorer' && (
                <LogExplorerView
                  result={parseResult}
                  filterClusterId={filterClusterId}
                  onClearClusterFilter={() => setFilterClusterId(undefined)}
                />
              )}

              {currentView === 'incidents' && (
                <IncidentsView
                  result={parseResult}
                  selectedIncident={selectedIncident}
                  onSelectIncident={(inc) => setSelectedIncident(inc)}
                  onFilterLogs={handleFilterLogs}
                  onResolveIncident={handleResolveIncident}
                  onReopenIncident={handleReopenIncident}
                />
              )}

              {currentView === 'services' && (
                <ServicesView onFilterServiceLogs={handleFilterServiceLogs} />
              )}

              {currentView === 'ai_insights' && (
                <AiInsightsView
                  result={parseResult}
                  onSelectIncident={(inc) => {
                    setSelectedIncident(inc);
                    setIsDetailModalOpen(true);
                  }}
                />
              )}

              {currentView === 'alerts' && <AlertsView />}

              {currentView === 'integrations' && <IntegrationsView />}

              {currentView === 'settings' && (
                <SettingsView
                  clusteringConfig={clusteringConfig}
                  onUpdateConfig={handleApplyThresholdConfig}
                  environment={environment}
                  setEnvironment={setEnvironment}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
              <div className="text-sm font-medium text-slate-300">
                Bootstrapping Drain pattern analysis engine...
              </div>
            </div>
          )}
        </main>

        {/* Minimal Footer */}
        <footer className="border-t border-slate-800/80 bg-[#0d111a]/80 py-3.5 px-6 text-xs text-slate-400 mt-auto backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Log Lenx.</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Autonomous Drain template clustering</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400">Deterministic blast radius ranking</span>
            </div>

            <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] text-slate-400">
              <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">1</kbd> Overview</span>
              <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">2</kbd> Explorer</span>
              <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">3</kbd> Incidents</span>
              <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">4</kbd> Services</span>
              <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">5</kbd> AI Insights</span>
              <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Esc</kbd> Close</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Incident Detail Investigation Modal */}
      <IncidentDetailModal
        isOpen={isDetailModalOpen}
        incident={selectedIncident}
        onClose={() => setIsDetailModalOpen(false)}
        onFilterLogs={handleFilterLogs}
        onResolveIncident={handleResolveIncident}
        onReopenIncident={handleReopenIncident}
      />

      {/* Grouping Sensitivity Configuration Modal */}
      <ThresholdConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={clusteringConfig}
        onApplyConfig={handleApplyThresholdConfig}
        totalErrors={parseResult?.errorCount || 0}
        currentIncidentCount={parseResult?.incidents.length || 0}
      />

      {/* Scenario Presets & Ingestion Modal */}
      <LogIngestionModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngestText={(text, preset) => analyzeLogText(text, preset, clusteringConfig)}
        isLoading={isLoading}
      />
    </div>
  );
}
