/**
 * Log Ingestion Modal
 * Supports file drag & drop, raw paste with 10k lines, and curated incident presets.
 */

import React, { useState } from 'react';
import { X, Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { PresetKey } from '../types/log';
import { PRESET_METADATA, generatePresetLogs } from '../utils/logDatasets';

interface LogIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestText: (text: string, presetKey?: PresetKey) => void;
  isLoading: boolean;
}

export const LogIngestionModal: React.FC<LogIngestionModalProps> = ({
  isOpen,
  onClose,
  onIngestText,
  isLoading,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('payment_cascade');
  const [activeMode, setActiveMode] = useState<'presets' | 'paste' | 'file'>('presets');
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePresetSubmit = () => {
    const raw = generatePresetLogs(selectedPreset, 10000);
    onIngestText(raw, selectedPreset);
    onClose();
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    onIngestText(pasteText);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPasteText(content);
        setActiveMode('paste');
      }
    };
    reader.readAsText(file);
  };

  const lineCount = pasteText ? pasteText.split('\n').length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <h3 className="text-base font-bold text-white">Ingest Raw Logs / Scenarios</h3>
            <p className="text-xs text-slate-400">
              Process up to 50,000 lines instantly without hand-written rules.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => setActiveMode('presets')}
            className={`px-3.5 py-2 font-medium rounded-t-lg transition-colors ${
              activeMode === 'presets'
                ? 'bg-slate-800 text-white border-t border-x border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Realistic 10,000-Line Presets
          </button>
          <button
            onClick={() => setActiveMode('paste')}
            className={`px-3.5 py-2 font-medium rounded-t-lg transition-colors ${
              activeMode === 'paste'
                ? 'bg-slate-800 text-white border-t border-x border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste Raw Logs {lineCount > 0 ? `(${lineCount.toLocaleString()} lines)` : ''}
          </button>
          <button
            onClick={() => setActiveMode('file')}
            className={`px-3.5 py-2 font-medium rounded-t-lg transition-colors ${
              activeMode === 'file'
                ? 'bg-slate-800 text-white border-t border-x border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload File (.log / .txt / .jsonl)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {activeMode === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-400">
                Choose a realistic 3 A.M. outage scenario generated with 10,000 real lines, multi-service topologies, and stack traces:
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {(Object.keys(PRESET_METADATA) as PresetKey[]).map(key => {
                  const meta = PRESET_METADATA[key];
                  const isSelected = selectedPreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedPreset(key)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-neutral-500 bg-neutral-800/80 shadow-sm'
                          : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-xs text-neutral-200">{meta.title}</div>
                        <div className="text-[11px] font-mono text-neutral-400 tabular-nums">
                          {meta.lines.toLocaleString()} lines · {meta.severity}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-400 mt-1">{meta.subtitle}</div>
                      <div className="text-[11px] text-neutral-500 font-mono mt-1.5">
                        Services: {meta.services.join(', ')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeMode === 'paste' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Paste raw log text below:</span>
                <span className="font-mono tabular-nums">{lineCount.toLocaleString()} lines detected</span>
              </div>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="2026-10-09 02:58:01.123 ERROR [PaymentService] Database connection timeout&#10;2026-10-09 02:58:01.145 FATAL [postgres-primary] remaining connection slots are reserved&#10;..."
                rows={10}
                className="w-full p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
              />
            </div>
          )}

          {activeMode === 'file' && (
            <div className="border-2 border-dashed border-neutral-800 rounded-lg p-8 text-center space-y-3 bg-neutral-950/40">
              <Upload className="w-8 h-8 text-neutral-500 mx-auto" />
              <div>
                <p className="text-xs text-neutral-300 font-medium">
                  {fileName ? `Loaded: ${fileName}` : 'Choose a log file to ingest'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Supports .log, .txt, .jsonl, .out (tested up to 50MB)
                </p>
              </div>
              <label className="inline-block px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded cursor-pointer transition-colors">
                <span>Select Local File</span>
                <input
                  type="file"
                  accept=".log,.txt,.json,.jsonl,.out"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/70 text-xs">
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 font-medium"
          >
            Cancel
          </button>

          <button
            disabled={isLoading || (activeMode === 'paste' && !pasteText.trim())}
            onClick={activeMode === 'presets' ? handlePresetSubmit : handlePasteSubmit}
            className="px-4 py-2 bg-neutral-100 hover:bg-white text-neutral-950 font-semibold rounded transition-colors disabled:opacity-50 shadow-sm"
          >
            {isLoading ? 'Analyzing Stream...' : 'Run Incident Triage'}
          </button>
        </div>
      </div>
    </div>
  );
};
