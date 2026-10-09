/**
 * Cascade Timeline & Spike Histogram
 * Shows the exact moment the incident erupted and the sequence of downstream failures.
 */

import React from 'react';
import { TimeBucket, Incident } from '../types/log';

interface TimelineSpikeProps {
  timeBuckets: TimeBucket[];
  incidents: Incident[];
  onSelectIncident: (inc: Incident) => void;
}

export const TimelineSpike: React.FC<TimelineSpikeProps> = ({
  timeBuckets,
  incidents,
  onSelectIncident,
}) => {
  if (!timeBuckets || timeBuckets.length === 0) return null;

  const maxTotal = Math.max(...timeBuckets.map(b => b.totalCount), 1);
  const maxError = Math.max(...timeBuckets.map(b => b.errorCount), 1);

  return (
    <div className="border border-slate-800/80 bg-slate-900/70 rounded-2xl p-6 space-y-4 shadow-xl shadow-slate-950/20 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Log Velocity & Cascade Timeline</h2>
          <p className="text-xs text-slate-400">
            Temporal distribution showing normal baseline traffic transitioning to the 02:58 incident burst.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-700 inline-block"></span>
            <span>Total Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block shadow-sm"></span>
            <span className="text-rose-400 font-semibold">Error Burst</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="pt-2">
        <div className="h-32 flex items-end gap-1.5 w-full">
          {timeBuckets.map((bucket, i) => {
            const totalHeightPct = Math.max(6, (bucket.totalCount / maxTotal) * 100);
            const errorHeightPct = bucket.errorCount > 0 
              ? Math.max(4, (bucket.errorCount / maxTotal) * 100) 
              : 0;

            return (
              <div
                key={i}
                className="flex-1 flex flex-col justify-end items-center h-full group relative"
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-12 z-30 bg-neutral-950 border border-neutral-800 text-[11px] p-2 rounded shadow-lg whitespace-nowrap text-neutral-200">
                  <div className="font-mono text-neutral-400">{bucket.timeLabel} UTC</div>
                  <div className="font-mono tabular-nums">
                    Errors: <span className="text-rose-400 font-semibold">{bucket.errorCount}</span> / Total: {bucket.totalCount}
                  </div>
                </div>

                {/* Stacked bar container */}
                <div
                  className="w-full rounded-t-sm transition-all duration-150 relative overflow-hidden"
                  style={{
                    height: `${totalHeightPct}%`,
                    backgroundColor: bucket.errorCount > 0 ? '#262626' : '#1f1f23',
                  }}
                >
                  {errorHeightPct > 0 && (
                    <div
                      className="w-full bg-rose-600/90 group-hover:bg-rose-500 transition-colors absolute bottom-0"
                      style={{ height: `${(bucket.errorCount / Math.max(bucket.totalCount, 1)) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* X Axis Timestamps */}
        <div className="flex justify-between items-center text-[11px] font-mono tabular-nums text-neutral-500 pt-2 border-t border-neutral-800">
          <span>{timeBuckets[0]?.timeLabel || '02:45:00'} UTC</span>
          <span>Onset Window (02:58:02 UTC)</span>
          <span>{timeBuckets[timeBuckets.length - 1]?.timeLabel || '03:15:00'} UTC</span>
        </div>
      </div>

      {/* Sequential Failure Sequence */}
      <div className="pt-2 border-t border-neutral-800">
        <div className="text-xs font-medium text-neutral-300 mb-2">
          Chronological Cascade Progression:
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {incidents.slice(0, 4).map((inc, idx) => (
            <button
              key={inc.id}
              onClick={() => onSelectIncident(inc)}
              className="text-left p-2.5 rounded border border-neutral-800/80 bg-neutral-950/60 hover:bg-neutral-800/40 hover:border-neutral-700 transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-neutral-500">Step {idx + 1} · {inc.firstSeen.split(' ')[1] || inc.firstSeen}</span>
                {inc.isLikelyTrigger ? (
                  <span className="text-[10px] text-rose-400 font-medium">Root Trigger</span>
                ) : (
                  <span className="text-[10px] text-neutral-400">+{idx * 6}s downstream</span>
                )}
              </div>
              <div className="text-xs font-medium text-neutral-200 line-clamp-2">
                {inc.template}
              </div>
              <div className="text-[11px] text-neutral-400">
                {inc.services.join(', ')} · <span className="font-mono tabular-nums">{inc.count.toLocaleString()} occurrences</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
