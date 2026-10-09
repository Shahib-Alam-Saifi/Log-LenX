/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TopNav } from './components/TopNav';
import { IntuitiveVisualOverview } from './components/IntuitiveVisualOverview';
import { CascadeFlowchart } from './components/CascadeFlowchart';
import { IncidentListItem } from './components/IncidentListItem';
import { IncidentDetailPanel } from './components/IncidentDetailPanel';
import { TimelineSpike } from './components/TimelineSpike';
import { RawLogsViewer } from './components/RawLogsViewer';
import { PostmortemBrief } from './components/PostmortemBrief';
import { LogIngestionModal } from './components/LogIngestionModal';
import { ThresholdConfigModal } from './components/ThresholdConfigModal';
import { ParseResult, Incident, PresetKey, ClusteringConfig, DEFAULT_CLUSTERING_CONFIG } from './types/log';
import { generatePresetLogs, PRESET_METADATA } from './utils/logDatasets';
import { processLogsAsync } from './utils/logAnalyzer';
import { RefreshCw, Sliders } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'flowchart' | 'logs' | 'brief'>('overview');
  const [currentPreset, setCurrentPreset] = useState<PresetKey>('payment_cascade');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progressText, setProgressText] = useState<string>('Analyzing 10,000 log lines...');
  const [progressPercent, setProgressPercent] = useState<number>(10);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [clusteringConfig, setClusteringConfig] = useState<ClusteringConfig>(DEFAULT_CLUSTERING_CONFIG);
  const [filterClusterId, setFilterClusterId] = useState<string | undefined>(undefined);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'Critical' | 'High'>('ALL');

  // Keep a reference to current raw log stream so re-clustering with new threshold is instant
  const currentRawLogsRef = useRef<string>('');

  // Load and process logs with active clustering configuration
  const analyzeLogText = useCallback(async (
    rawText: string,
    presetKey?: PresetKey,
    configToUse: ClusteringConfig = clusteringConfig
  ) => {
    setIsLoading(true);
    setProgressPercent(10);
    setProgressText('Ingesting log stream...');
    currentRawLogsRef.current = rawText;

    if (presetKey) {
      setCurrentPreset(presetKey);
    }

    try {
      const result = await processLogsAsync(
        rawText,
        (pct, msg) => {
          setProgressPercent(pct);
          setProgressText(msg);
        },
        configToUse
      );
      setParseResult(result);
      
      const root = result.incidents.find(i => i.isLikelyTrigger) || result.incidents[0];
      if (root) {
        setSelectedIncidentId(root.id);
      }
    } catch (err) {
      console.error('Failed to parse logs', err);
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
  const handleApplyThresholdConfig = (newConfig: ClusteringConfig) => {
    setClusteringConfig(newConfig);
    if (currentRawLogsRef.current) {
      analyzeLogText(currentRawLogsRef.current, undefined, newConfig);
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Escape') {
        setIsIngestModalOpen(false);
        setIsConfigModalOpen(false);
      } else if (e.key === '1') {
        setActiveTab('overview');
      } else if (e.key === '2') {
        setActiveTab('incidents');
      } else if (e.key === '3') {
        setActiveTab('flowchart');
      } else if (e.key === '4') {
        setActiveTab('logs');
      } else if (e.key === '5') {
        setActiveTab('brief');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Selected incident reference
  const selectedIncident = React.useMemo(() => {
    if (!parseResult) return null;
    return parseResult.incidents.find(i => i.id === selectedIncidentId) || parseResult.incidents[0];
  }, [parseResult, selectedIncidentId]);

  // Filtered incidents for the left column
  const displayedIncidents = React.useMemo(() => {
    if (!parseResult) return [];
    let list = [...parseResult.incidents];
    if (severityFilter !== 'ALL') {
      list = list.filter(i => i.severity === severityFilter);
    }
    return list;
  }, [parseResult, severityFilter]);

  const handleFilterLogs = (incidentId: string) => {
    setFilterClusterId(incidentId);
    setActiveTab('logs');
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenIngest={() => setIsIngestModalOpen(true)}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        similarityThreshold={clusteringConfig.similarityThreshold}
        totalLines={parseResult?.totalLines || 10000}
        incidentCount={parseResult?.incidents.length || 0}
        currentScenarioName={PRESET_METADATA[currentPreset]?.title || 'Custom Logs'}
      />

      {/* Progress banner during log processing */}
      {isLoading && (
        <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-3 flex items-center justify-between text-xs backdrop-blur-md">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
            <span className="font-medium text-slate-200">{progressText}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-28 bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-slate-400 tabular-nums">{progressPercent}%</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      {parseResult && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-8">
          {/* TAB 1: VISUAL OVERVIEW (Minimal Text, Graphs First!) */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Quick Sensitivity Context Banner */}
              <div className="flex items-center justify-between px-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Grouped with Drain Algorithm</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-indigo-400 font-mono font-medium">
                    {Math.round(clusteringConfig.similarityThreshold * 100)}% Similarity Threshold
                  </span>
                  <span className="text-slate-600">·</span>
                  <span>{parseResult.incidents.length} actionable clusters</span>
                </div>

                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Tune Grouping Sensitivity</span>
                </button>
              </div>

              <IntuitiveVisualOverview
                result={parseResult}
                selectedIncidentId={selectedIncident?.id}
                onSelectIncident={(inc) => setSelectedIncidentId(inc.id)}
                onGoToIncidents={() => setActiveTab('incidents')}
              />
            </div>
          )}

          {/* TAB 2: INCIDENTS & RUNBOOK (Focused Deep Dive) */}
          {activeTab === 'incidents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">
                    Ranked Incident Queue ({displayedIncidents.length})
                  </span>
                  <span className="text-slate-500">·</span>
                  <span>Select any incident to inspect checklist and stack trace</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Sliders className="w-3 h-3 text-indigo-400" />
                    <span>Sensitivity: {Math.round(clusteringConfig.similarityThreshold * 100)}%</span>
                  </button>

                  <div className="flex items-center gap-1.5 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px]">
                    {(['ALL', 'Critical', 'High'] as const).map(sev => (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev)}
                        className={`px-2.5 py-0.5 rounded-md transition-colors ${
                          severityFilter === sev
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (5 of 12 columns): Incident List */}
                <div className="lg:col-span-5 space-y-2.5">
                  {displayedIncidents.map((incident, idx) => (
                    <IncidentListItem
                      key={incident.id}
                      incident={incident}
                      index={idx}
                      isSelected={incident.id === selectedIncident?.id}
                      onSelect={() => setSelectedIncidentId(incident.id)}
                    />
                  ))}
                </div>

                {/* Right Column (7 of 12 columns): Inline Deep Dive & Runbook */}
                <div className="lg:col-span-7">
                  {selectedIncident ? (
                    <IncidentDetailPanel
                      incident={selectedIncident}
                      onFilterLogs={handleFilterLogs}
                    />
                  ) : (
                    <div className="border border-slate-800/80 rounded-2xl p-12 text-center text-xs text-slate-400 bg-slate-900/40">
                      Select an incident from the left to view details and action runbook.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIVE CASCADE FLOWCHART */}
          {activeTab === 'flowchart' && (
            <div className="space-y-6">
              <CascadeFlowchart
                incidents={parseResult.incidents}
                selectedIncidentId={selectedIncident?.id}
                onSelectIncident={(inc) => {
                  setSelectedIncidentId(inc.id);
                  setActiveTab('incidents');
                }}
              />

              {/* Connected Timeline Histogram */}
              <TimelineSpike
                timeBuckets={parseResult.timeBuckets}
                incidents={parseResult.incidents}
                onSelectIncident={(inc) => {
                  setSelectedIncidentId(inc.id);
                  setActiveTab('incidents');
                }}
              />
            </div>
          )}

          {/* TAB 4: RAW LOGS EXPLORER */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <RawLogsViewer
                entries={parseResult.entries}
                incidents={parseResult.incidents}
                selectedClusterId={filterClusterId}
                onClearClusterFilter={() => setFilterClusterId(undefined)}
              />
            </div>
          )}

          {/* TAB 5: SLACK BRIEF & POSTMORTEM */}
          {activeTab === 'brief' && (
            <div className="space-y-4">
              <PostmortemBrief result={parseResult} />
            </div>
          )}
        </main>
      )}

      {/* Threshold Sensitivity Configuration Modal */}
      <ThresholdConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={clusteringConfig}
        onApplyConfig={handleApplyThresholdConfig}
        totalErrors={parseResult?.errorCount || 0}
        currentIncidentCount={parseResult?.incidents.length || 0}
      />

      {/* Ingestion & Scenario Switcher Modal */}
      <LogIngestionModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onIngestText={(text, preset) => analyzeLogText(text, preset, clusteringConfig)}
        isLoading={isLoading}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/70 py-4 px-6 text-xs text-slate-400 mt-auto backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Log Lenx.</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Local in-memory Drain template miner</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Zero cloud transmission</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">1</kbd> Visual Overview</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">2</kbd> Runbook</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">3</kbd> Flowchart</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">4</kbd> Logs</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">5</kbd> Brief</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
