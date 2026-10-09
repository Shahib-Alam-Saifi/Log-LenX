/**
 * Services View matching video frames 00:14 to 00:17.
 * Grid of connected microservices with uptime, active incident count, and direct logs jump.
 */

import React, { useState, useEffect } from 'react';
import { Server, Activity, ArrowRight, ExternalLink, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  activeIncidents: number;
  observedEvents: number;
  uptime: string;
  status: 'nominal' | 'degraded' | 'critical';
  p99Latency: string;
}

interface ServicesViewProps {
  onFilterServiceLogs: (serviceName: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ onFilterServiceLogs }) => {
  const [services, setServices] = useState<ServiceItem[]>([
    {
      id: 'payment-service',
      name: 'payment-service',
      description: 'Transactional payment processing and settlement worker',
      activeIncidents: 1,
      observedEvents: 1284,
      uptime: '99.1%',
      status: 'critical',
      p99Latency: '3,450ms',
    },
    {
      id: 'api-gateway',
      name: 'api-gateway',
      description: 'Edge reverse proxy, SSL termination, and routing mesh',
      activeIncidents: 1,
      observedEvents: 856,
      uptime: '99.8%',
      status: 'degraded',
      p99Latency: '512ms',
    },
    {
      id: 'auth-service',
      name: 'auth-service',
      description: 'OAuth2 / JWKS token issuance and session validation',
      activeIncidents: 1,
      observedEvents: 432,
      uptime: '99.9%',
      status: 'nominal',
      p99Latency: '45ms',
    },
    {
      id: 'worker-service',
      name: 'worker-service',
      description: 'Async task queues, order notification webhooks',
      activeIncidents: 0,
      observedEvents: 216,
      uptime: '100%',
      status: 'nominal',
      p99Latency: '82ms',
    },
    {
      id: 'notification-service',
      name: 'notification-service',
      description: 'Customer SMS and email order confirmation dispatchers',
      activeIncidents: 0,
      observedEvents: 158,
      uptime: '100%',
      status: 'nominal',
      p99Latency: '38ms',
    },
  ]);

  // Fetch real service pulse from backend
  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (data.services) setServices(data.services);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((svc) => (
          <div
            key={svc.id}
            className="bg-[#121623] border border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-all"
          >
            <div className="space-y-3">
              {/* Header with Status Indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-purple-400">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{svc.name}</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                      <span className={`w-2 h-2 rounded-full ${
                        svc.status === 'critical' ? 'bg-rose-500 animate-pulse' :
                        svc.status === 'degraded' ? 'bg-amber-500' : 'bg-emerald-400'
                      }`}></span>
                      <span className="capitalize">{svc.status}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-[11px] text-slate-500">Uptime</div>
                  <div className="text-xs font-bold text-slate-200">{svc.uptime}</div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {svc.description}
              </p>
            </div>

            {/* Metrics & Jump Action */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block">Active incidents</span>
                  <span className={`font-bold ${svc.activeIncidents > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {svc.activeIncidents} active
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Observed events</span>
                  <span className="font-bold text-slate-200">
                    {svc.observedEvents.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onFilterServiceLogs(svc.name)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
