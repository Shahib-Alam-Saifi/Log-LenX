/**
 * Integrations View matching video frames 00:21 to 00:23.
 * Cards for OpenTelemetry, Datadog, Slack, and PagerDuty with status and connection modals.
 */

import React, { useState } from 'react';
import { Blocks, CheckCircle2, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const integrations = [
    {
      id: 'opentelemetry',
      name: 'OpenTelemetry',
      description: 'Log and telemetry ingestion collector',
      status: 'Connected',
      endpoint: 'grpc://otel-collector.internal:4317',
      rate: '14,200 events/sec',
    },
    {
      id: 'datadog',
      name: 'Datadog',
      description: 'Log and telemetry synchronization forwarder',
      status: 'Connected',
      endpoint: 'https://http-intake.logs.datadoghq.com',
      rate: 'Live sync active',
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Incident notifications & war-room channels',
      status: 'Connected',
      endpoint: '#incidents, #prod-p0-alerts',
      rate: 'Webhook configured',
    },
    {
      id: 'pagerduty',
      name: 'PagerDuty',
      description: 'Automated on-call engineer paging schedule',
      status: 'Connected',
      endpoint: 'Service: Core Backend Microservices',
      rate: 'Escalation policy active',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="bg-[#121623] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-purple-400">
                  <Blocks className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{item.status}</span>
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-base">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-400 space-y-1">
                <div className="text-slate-500 text-[10px]">Active route:</div>
                <div className="truncate text-slate-300 font-semibold">{item.endpoint}</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedIntegration(item.name)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View connection</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{selectedIntegration} Connection</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connection health check verified. The ingestion daemon is actively communicating with port 3000 observability backend without error.
            </p>
            <button
              onClick={() => setSelectedIntegration(null)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
