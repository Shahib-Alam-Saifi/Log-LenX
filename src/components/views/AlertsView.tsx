/**
 * Alerts View matching video frame 00:20.
 * Table of configured alert rules, targets, notification channels, and active state.
 */

import React, { useState, useEffect } from 'react';
import { Bell, Plus, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface AlertRule {
  id: string;
  name: string;
  target: string;
  channels: string;
  status: string;
  lastTriggered: string;
  triggered: boolean;
  severity: string;
}

export const AlertsView: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertRule[]>([
    {
      id: 'alt-1',
      name: 'Error rate exceeds 1%',
      target: 'All connected services',
      channels: 'Email and Slack #incidents',
      status: 'Active',
      lastTriggered: '2 minutes ago',
      triggered: true,
      severity: 'Critical',
    },
    {
      id: 'alt-2',
      name: 'P99 latency exceeds 2000ms',
      target: 'api-gateway, payment-service',
      channels: 'Slack #devops-alerts',
      status: 'Active',
      lastTriggered: '5 minutes ago',
      triggered: true,
      severity: 'High',
    },
    {
      id: 'alt-3',
      name: 'Memory usage exceeds 85%',
      target: 'worker-service',
      channels: 'Email ops@acme.io',
      status: 'Active',
      lastTriggered: '18 minutes ago',
      triggered: false,
      severity: 'Medium',
    },
    {
      id: 'alt-4',
      name: 'PostgreSQL connection saturation > 90%',
      target: 'postgres-primary',
      channels: 'PagerDuty On-Call Schedule',
      status: 'Active',
      lastTriggered: 'Just now',
      triggered: true,
      severity: 'Critical',
    },
  ]);

  useEffect(() => {
    fetch('/api/alerts')
      .then(res => res.json())
      .then(data => {
        if (data.alerts) setAlerts(data.alerts);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Table Container */}
      <div className="bg-[#121623] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div>
            <h3 className="text-sm font-bold text-white">Alert rules</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active anomaly thresholds and notification routing rules
            </p>
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-md shadow-purple-900/20">
            <Plus className="w-3.5 h-3.5" />
            <span>Create alert rule</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0e121c] text-[10px] font-mono uppercase text-slate-500 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Alert rule</th>
                <th className="py-3 px-4">Target service</th>
                <th className="py-3 px-4">Channels</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Last triggered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {alerts.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                    {rule.triggered ? (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    )}
                    <span>{rule.name}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300">
                      {rule.target}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 font-sans">
                    {rule.channels}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rule.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300' :
                      rule.severity === 'High' ? 'bg-amber-500/20 text-amber-300' : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {rule.severity}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-sans">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{rule.status}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right text-slate-400 text-[11px]">
                    {rule.lastTriggered}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
