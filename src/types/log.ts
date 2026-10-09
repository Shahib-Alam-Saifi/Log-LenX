/**
 * Log Intelligence and Clustering Type Definitions
 */

export type LogLevel = 'FATAL' | 'CRITICAL' | 'ERROR' | 'WARN' | 'WARNING' | 'INFO' | 'DEBUG' | 'TRACE';

export interface LogEntry {
  id: string;
  raw: string;
  timestamp: string;
  epoch: number;
  level: LogLevel;
  service: string;
  message: string;
  traceId?: string;
  stackTrace?: string[];
  clusterId?: string;
}

export interface VariableSlot {
  name: string;
  sampleValues: string[];
  uniqueCount: number;
}

export interface TimeBucket {
  timeLabel: string;
  epoch: number;
  totalCount: number;
  errorCount: number;
}

export interface Incident {
  id: string;
  title: string;
  humanSummary: string;
  template: string;
  patternTokens: string[];
  count: number;
  percentageOfErrors: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  dominantLevel: LogLevel;
  services: string[];
  serviceCount: number;
  firstSeen: string;
  firstSeenEpoch: number;
  lastSeen: string;
  lastSeenEpoch: number;
  durationFormatted: string;
  peakVelocity: number; // events per second
  impactScore: number; // 0 - 100
  isLikelyTrigger: boolean;
  triggerRationale: string;
  examples: string[];
  sampleEntries: LogEntry[];
  variableSlots: VariableSlot[];
  timeBuckets: { time: string; count: number }[];
  suggestedMitigation: string[];
  status?: 'active' | 'investigating' | 'mitigating' | 'resolved';
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  remediationLogs?: string[];
  remediationMetrics?: {
    metricName: string;
    before: string;
    after: string;
  }[];
}

export interface ParseResult {
  entries: LogEntry[];
  incidents: Incident[];
  totalLines: number;
  parsedCount: number;
  skippedCount: number;
  errorCount: number;
  services: string[];
  processingTimeMs: number;
  timeRange: {
    start: string;
    end: string;
    durationMinutes: number;
  };
  rootTriggerIncidentId?: string;
  timeBuckets: TimeBucket[];
}

export type PresetKey = 'payment_cascade' | 'k8s_oom' | 'auth_desync' | 'redis_partition';

export interface ClusteringConfig {
  similarityThreshold: number; // 0.30 - 0.95 (default: 0.65)
  depth: number; // 3 - 6 (default: 4)
  maxChildren: number; // 50 - 200 (default: 120)
  normalizeUuids: boolean;
  normalizeIps: boolean;
  normalizeNumbers: boolean;
  normalizeHex: boolean;
  foldStackTraces: boolean;
}

export const DEFAULT_CLUSTERING_CONFIG: ClusteringConfig = {
  similarityThreshold: 0.65,
  depth: 4,
  maxChildren: 120,
  normalizeUuids: true,
  normalizeIps: true,
  normalizeNumbers: true,
  normalizeHex: true,
  foldStackTraces: true,
};
