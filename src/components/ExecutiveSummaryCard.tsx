/**
 * Executive Summary Card for Log Lenx.
 * Answers "What broke?", "Who is hit?", and "What command do I run?" inside 30 seconds.
 */

import React, { useState } from 'react';
import { Incident } from '../types/log';
import { AlertOctagon, Terminal, ArrowRight, Copy, Check, ShieldAlert, Cpu } from 'lucide-react';

interface ExecutiveSummaryCardProps {
  rootIncident: Incident | undefined;
  incidentCount: number;
  totalLines: number;
  onOpenFlowchart: () => void;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({
  rootIncident,
  incidentCount,
  totalLines,
  onOpenFlowchart,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!rootIncident) return null;

  // Derive immediate command snippet based on the root incident type
  const getFixCommand = () => {
    const t = rootIncident.template.toLowerCase();
    if (t.includes('connection') || t.includes('postgres') || t.includes('pool')) {
      return `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND state_change < current_timestamp - INTERVAL '2 minutes';`;
    }
    if (t.includes('oom') || t.includes('memory') || t.includes('137')) {
      return `kubectl delete pod -l app=analytics-worker --now && kubectl scale deployment analytics-worker --replicas=8`;
    }
    if (t.includes('jwt') || t.includes('auth') || t.includes('jwks')) {
      return `curl -X POST https://auth-service.internal/admin/jwks/force-refresh -H "Authorization: Bearer $ADMIN_TOKEN"`;
    }
    if (t.includes('redis') || t.includes('sentinel')) {
      return `redis-cli -h redis-sentinel sentinel failover mymaster`;
    }
    return `systemctl restart ${rootIncident.services[0]} && tail -f /var/log/${rootIncident.services[0]}.log`;
  };

  const command = getFixCommand();

  const copyCommand = () => {
    navigator.clipboard.writeText(command);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 text-xs">
        <div className="flex items-center gap-2 text-rose-400 font-semibold">
          <AlertOctagon className="w-4 h-4" />
          <span>3 A.M. Incident Action Brief (Triaged from {totalLines.toLocaleString()} Lines)</span>
        </div>
        <button
          onClick={onOpenFlowchart}
          className="text-neutral-400 hover:text-neutral-200 flex items-center gap-1 font-medium transition-colors"
        >
          <span>View Interactive Flowchart</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1: What Broke */}
        <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-3.5 space-y-1.5">
          <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>1. Origin / Root Cause</span>
          </div>
          <div className="text-sm font-bold text-neutral-100">
            {rootIncident.title}
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            First seen at <span className="text-neutral-200 font-mono">{rootIncident.firstSeen.split(' ')[1] || rootIncident.firstSeen}</span> in <code className="text-neutral-300 font-mono bg-neutral-900 px-1 py-0.5 rounded">{rootIncident.services.join(', ')}</code>.
          </p>
        </div>

        {/* Step 2: The Cascade */}
        <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-3.5 space-y-1.5">
          <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>2. Downstream Blast Radius</span>
          </div>
          <div className="text-sm font-bold text-neutral-100">
            {incidentCount - 1} Cascading Incidents
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Starvation cascaded to payment threads, resulting in <span className="text-neutral-200 font-semibold">{rootIncident.count.toLocaleString()}</span> error events across services.
          </p>
        </div>

        {/* Step 3: Immediate Fix Command */}
        <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>3. Immediate Remediation Command</span>
            </div>
            <button
              onClick={copyCommand}
              className="text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="font-mono text-[11px] text-emerald-300/90 bg-neutral-900 p-2 rounded border border-neutral-800 truncate select-all">
            {command}
          </div>
          <p className="text-[11px] text-neutral-500">
            Execute in staging/production console to unblock connections immediately.
          </p>
        </div>
      </div>
    </div>
  );
};
