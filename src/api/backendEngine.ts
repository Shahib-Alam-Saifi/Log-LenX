/**
 * Shared Core Observability Backend Engine for Log Lenx.
 * Handles deterministic log parsing, Drain template clustering,
 * blast radius impact scoring, and REST API state.
 */

import { generatePresetLogs } from '../utils/logDatasets';
import { parseRawLogs } from '../utils/logParser';
import { DrainMiner } from '../utils/drainEngine';
import { rankIncidents } from '../utils/impactRanker';
import { ClusteringConfig, DEFAULT_CLUSTERING_CONFIG, PresetKey, ParseResult } from '../types/log';

// In-memory backend state
let currentConfig: ClusteringConfig = { ...DEFAULT_CLUSTERING_CONFIG };
let currentLogsRaw = generatePresetLogs('payment_cascade', 10000);
let currentParseResult: ParseResult | null = null;
let currentEnvironment = 'Production';

// Track resolved incidents across re-clustering
const resolvedIncidentsMap = new Map<string, {
  resolvedAt: string;
  resolvedBy: string;
  notes: string;
}>();

export function computeAnalysis(rawText: string, config: ClusteringConfig = currentConfig): ParseResult {
  const t0 = performance.now();
  const { entries, skippedLines } = parseRawLogs(rawText);
  const miner = new DrainMiner(config);

  for (let i = 0; i < entries.length; i++) {
    miner.addEntry(entries[i]);
  }

  const result = rankIncidents(entries, miner, t0);
  result.skippedCount = skippedLines;

  // Apply resolution state
  for (const inc of result.incidents) {
    if (resolvedIncidentsMap.has(inc.id)) {
      const res = resolvedIncidentsMap.get(inc.id)!;
      inc.status = 'resolved';
      inc.resolvedAt = res.resolvedAt;
      inc.resolvedBy = res.resolvedBy;
      inc.resolutionNotes = res.notes;
    } else {
      inc.status = inc.status || (inc.isLikelyTrigger ? 'investigating' : 'active');
    }
  }

  return result;
}

export function resolveIncident(incidentId: string, notes?: string, resolvedBy: string = 'On-Call SRE') {
  const resolvedAt = new Date().toISOString();
  resolvedIncidentsMap.set(incidentId, {
    resolvedAt,
    resolvedBy,
    notes: notes || 'Automated mitigation runbook executed successfully.',
  });

  if (currentParseResult) {
    const inc = currentParseResult.incidents.find((i) => i.id === incidentId);
    if (inc) {
      inc.status = 'resolved';
      inc.resolvedAt = resolvedAt;
      inc.resolvedBy = resolvedBy;
      inc.resolutionNotes = notes;
    }
  }

  return {
    success: true,
    incidentId,
    resolvedAt,
    resolvedBy,
    status: 'resolved',
  };
}

export function reopenIncident(incidentId: string) {
  resolvedIncidentsMap.delete(incidentId);

  if (currentParseResult) {
    const inc = currentParseResult.incidents.find((i) => i.id === incidentId);
    if (inc) {
      inc.status = inc.isLikelyTrigger ? 'investigating' : 'active';
      inc.resolvedAt = undefined;
      inc.resolvedBy = undefined;
      inc.resolutionNotes = undefined;
    }
  }

  return {
    success: true,
    incidentId,
    status: 'active',
  };
}

// Pre-initialize analysis
currentParseResult = computeAnalysis(currentLogsRaw, currentConfig);

export function getHealth() {
  return {
    status: 'healthy',
    uptimeSec: Math.round(process.uptime ? process.uptime() : 120),
    timestamp: new Date().toISOString(),
    version: '2.4.0-enterprise',
    engine: 'Drain-Template-Miner-v4',
  };
}

export function getStatus() {
  if (!currentParseResult) {
    currentParseResult = computeAnalysis(currentLogsRaw, currentConfig);
  }

  const totalLogs = currentParseResult.totalLines || 10000;
  const observedEvents = currentParseResult.errorCount || 2946;
  const resolvedCount = currentParseResult.incidents.filter((i) => i.status === 'resolved').length;
  const activeIncidents = currentParseResult.incidents.filter((i) => i.status !== 'resolved').length;
  const criticalIncidents = currentParseResult.incidents.filter((i) => i.severity === 'Critical' && i.status !== 'resolved').length;
  const observedServices = currentParseResult.services.length || 5;

  return {
    observedEvents: `${observedEvents.toLocaleString()} / ${totalLogs.toLocaleString()}`,
    rawObservedCount: observedEvents,
    totalLogs,
    activeIncidents: `${activeIncidents} / ${resolvedCount} resolved`,
    rawIncidentCount: activeIncidents,
    resolvedCount,
    criticalIncidents: `${criticalIncidents} / P0 Sev`,
    rawCriticalCount: criticalIncidents,
    observedServices: `${observedServices} / 100% operational`,
    rawServiceCount: observedServices,
    processingTimeMs: currentParseResult.processingTimeMs || 184,
    environment: currentEnvironment,
  };
}

export function getIncidents() {
  if (!currentParseResult) {
    currentParseResult = computeAnalysis(currentLogsRaw, currentConfig);
  }
  return {
    incidents: currentParseResult.incidents,
    total: currentParseResult.incidents.length,
    rootTriggerId: currentParseResult.rootTriggerIncidentId,
  };
}

export function getServices() {
  return {
    services: [
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
    ],
  };
}

export function getAlerts() {
  return {
    alerts: [
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
    ],
  };
}

export function getIntegrations() {
  return {
    integrations: [
      {
        id: 'opentelemetry',
        name: 'OpenTelemetry',
        description: 'OTel log, metric and trace ingestion collector',
        status: 'Connected',
        type: 'collector',
      },
      {
        id: 'datadog',
        name: 'Datadog',
        description: 'Log and telemetry synchronization forwarder',
        status: 'Connected',
        type: 'apm',
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Incident notification & triage channel bot',
        status: 'Connected',
        type: 'chatops',
      },
      {
        id: 'pagerduty',
        name: 'PagerDuty',
        description: 'Automated high-severity escalation routing',
        status: 'Connected',
        type: 'oncall',
      },
    ],
  };
}

export function getSettings() {
  return {
    config: currentConfig,
    environment: currentEnvironment,
    autoRefresh: true,
  };
}

export function updateSettings(config?: Partial<ClusteringConfig>, environment?: string) {
  if (config) {
    currentConfig = { ...currentConfig, ...config };
    currentParseResult = computeAnalysis(currentLogsRaw, currentConfig);
  }
  if (environment) {
    currentEnvironment = environment;
  }
  return {
    success: true,
    config: currentConfig,
    environment: currentEnvironment,
    parseResult: currentParseResult,
  };
}

export function analyzeLogs(params: {
  rawText?: string;
  presetKey?: PresetKey;
  config?: Partial<ClusteringConfig>;
}): ParseResult {
  if (params.config) {
    currentConfig = { ...currentConfig, ...params.config };
  }

  if (params.presetKey) {
    currentLogsRaw = generatePresetLogs(params.presetKey, 10000);
  } else if (params.rawText) {
    currentLogsRaw = params.rawText;
  }

  currentParseResult = computeAnalysis(currentLogsRaw, currentConfig);
  return currentParseResult;
}

export function getExportReport() {
  if (!currentParseResult) {
    currentParseResult = computeAnalysis(currentLogsRaw, currentConfig);
  }
  return {
    exportDate: new Date().toISOString(),
    environment: currentEnvironment,
    summary: {
      totalLines: currentParseResult.totalLines,
      errorCount: currentParseResult.errorCount,
      incidentCount: currentParseResult.incidents.length,
      rootTrigger: currentParseResult.rootTriggerIncidentId,
    },
    incidents: currentParseResult.incidents,
  };
}

export function getCurrentLogsRaw(): string {
  return currentLogsRaw;
}

export function getCurrentParseResult(): ParseResult {
  if (!currentParseResult) {
    currentParseResult = computeAnalysis(currentLogsRaw, currentConfig);
  }
  return currentParseResult;
}
