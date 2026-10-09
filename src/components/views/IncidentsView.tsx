/**
 * Incidents View matching video frames 00:04 to 00:06 and 00:10.
 * Prioritized incident management with status filter, causal trigger highlights, and investigation drawer.
 */

import React, { useState } from 'react';
import { ParseResult, Incident } from '../../types/log';
import { IncidentListItem } from '../IncidentListItem';
import { IncidentDetailPanel } from '../IncidentDetailPanel';
import { AlertTriangle, Filter, ArrowUpDown } from 'lucide-react';

interface IncidentsViewProps {
  result: ParseResult;
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  onFilterLogs: (incidentId: string) => void;
  onResolveIncident?: (incidentId: string, notes?: string) => void | Promise<void>;
  onReopenIncident?: (incidentId: string) => void | Promise<void>;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  result,
  selectedIncident,
  onSelectIncident,
  onFilterLogs,
  onResolveIncident,
  onReopenIncident,
}) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'Active' | 'Resolved' | 'Critical'>('ALL');

  const displayedIncidents = result.incidents.filter(inc => {
    if (filterMode === 'Active') return inc.status !== 'resolved';
    if (filterMode === 'Resolved') return inc.status === 'resolved';
    if (filterMode === 'Critical') return inc.severity === 'Critical';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">
            Ranked Incidents ({displayedIncidents.length})
          </span>
          <span className="text-slate-500">·</span>
          <span>Prioritized by blast radius and causal sequence</span>
        </div>

        <div className="flex items-center gap-1.5 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px]">
          {(['ALL', 'Active', 'Resolved', 'Critical'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-2.5 py-0.5 rounded-md transition-colors ${
                filterMode === mode
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Master-Detail Split: Left Incident Queue, Right Runbook & Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 space-y-2.5">
          {displayedIncidents.map((incident, idx) => (
            <IncidentListItem
              key={incident.id}
              incident={incident}
              index={idx}
              isSelected={incident.id === selectedIncident?.id}
              onSelect={() => onSelectIncident(incident)}
            />
          ))}
        </div>

        {/* Right Column (7 cols): Detailed Inspector & Action Runbook */}
        <div className="lg:col-span-7">
          {selectedIncident ? (
            <IncidentDetailPanel
              incident={selectedIncident}
              onFilterLogs={onFilterLogs}
              onResolveIncident={onResolveIncident}
              onReopenIncident={onReopenIncident}
            />
          ) : (
            <div className="border border-slate-800/80 rounded-2xl p-12 text-center text-xs text-slate-400 bg-slate-900/40">
              Select an incident from the list to view causal trigger, blast radius, and runbook.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
