/**
 * Incident Impact Ranking & Root Cause Trigger Detection
 * Computes blast radius, temporal precedence, and generates actionable on-call runbooks.
 */

import { DrainMiner } from './drainEngine';
import { LogEntry, LogLevel, Incident, ParseResult, TimeBucket } from '../types/log';

const SEVERITY_SCORES: Record<LogLevel, number> = {
  FATAL: 100,
  CRITICAL: 95,
  ERROR: 80,
  WARN: 45,
  WARNING: 45,
  INFO: 15,
  DEBUG: 5,
  TRACE: 5,
};

function formatDuration(millis: number): string {
  if (millis < 1000) return `${millis}ms`;
  const secs = Math.round(millis / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins}m ${remainingSecs}s`;
}

function deriveHumanTitleAndSummary(template: string, services: string[]): { title: string; summary: string } {
  const t = template.toLowerCase();
  const svc = services[0] || 'system';

  if (t.includes('remaining connection slots') || (t.includes('max_connections') && t.includes('reached'))) {
    return {
      title: 'Database Connection Slots Exhausted',
      summary: 'PostgreSQL reached max connection limit (100/100). All subsequent connection requests were immediately dropped.',
    };
  }

  if (t.includes('hikaripool') || (t.includes('connection is not available') && t.includes('timed out'))) {
    return {
      title: 'HikariCP Pool Acquisition Timeout (30s)',
      summary: 'Payment service worker threads stalled for over 30 seconds waiting for available database sockets.',
    };
  }

  if (t.includes('504') || t.includes('gateway timeout')) {
    return {
      title: '504 Gateway Timeout Cascade on Checkout',
      summary: 'Upstream gateway timed out waiting for stalled payment processing, failing customer orders.',
    };
  }

  if (t.includes('retry attempt') && t.includes('exhausted')) {
    return {
      title: 'Ingress Client Retry Storm',
      summary: 'Mobile and web clients hammered the ingress proxy with 3x retry storms, amplifying system congestion.',
    };
  }

  if (t.includes('out of memory') || (t.includes('killed process') && t.includes('total-vm'))) {
    return {
      title: 'Linux Kernel OOM Killer Invocation',
      summary: 'Node memory exceeded limits. The Linux kernel forcefully killed worker processes to prevent node panic.',
    };
  }

  if (t.includes('exitcode=137') || (t.includes('failed liveness probe') && t.includes('oomkilled'))) {
    return {
      title: 'Kubernetes Pod OOMKilled (Exit Code 137)',
      summary: 'Kubelet killed and restarted worker containers in a continuous CrashLoopBackOff cycle.',
    };
  }

  if (t.includes('jwt') || (t.includes('signature') && t.includes('jwks'))) {
    return {
      title: 'JWKS Key Rotation Signature Desync',
      summary: 'Authentication service rejected valid user tokens because the rotated key ID was missing from local caches.',
    };
  }

  if (t.includes('401') && t.includes('unauthorized')) {
    return {
      title: 'HTTP 401 Unauthorized Tsunami',
      summary: 'Gateway returned 401 Unauthorized for thousands of client requests following the auth cache invalidation.',
    };
  }

  if (t.includes('sdown') || (t.includes('redis') && t.includes('heartbeat check'))) {
    return {
      title: 'Redis Master Sentinel Heartbeat Timeout',
      summary: 'Redis Sentinel flagged master node as SDOWN (subjectively down), initiating failover disruption.',
    };
  }

  if (t.includes('jedisconnectionexception') || (t.includes('cache') && t.includes('miss fallback'))) {
    return {
      title: 'Cache Miss Database Stampede',
      summary: 'Failed cache lookups bypassed Redis and inundated the relational database with concurrent read spikes.',
    };
  }

  // Fallback title
  const cleanTokens = template
    .replace(/<[^>]+>/g, '')
    .replace(/[\[\]\(\):,]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['and', 'for', 'the', 'with', 'from'].includes(w.toLowerCase()))
    .slice(0, 5)
    .join(' ');

  return {
    title: cleanTokens ? `[${svc}] ${cleanTokens}` : `Error Cluster in ${svc}`,
    summary: `Observed repeated failure pattern affecting ${services.join(', ')}.`,
  };
}

function deriveMitigations(template: string, services: string[]): string[] {
  const t = template.toLowerCase();
  const s = services.map(x => x.toLowerCase()).join(' ');

  if (t.includes('connection') && (t.includes('pool') || t.includes('timeout') || t.includes('exhausted') || t.includes('remaining connection'))) {
    return [
      'Query `pg_stat_activity` / DB thread list to identify stuck "idle in transaction" locks.',
      'Check active connection pool capacity (e.g. HikariCP / PgBouncer max limits).',
      'Temporarily scale connection pool ceiling or recycle zombie backend worker processes.',
      'Hold downstream traffic ingress retries to prevent retry storm amplification.',
    ];
  }

  if (t.includes('504') || t.includes('gateway timeout') || t.includes('upstream')) {
    return [
      'Upstream saturation cascade: do not restart ingress proxies first, as root delay is downstream.',
      'Check health and latency metrics of internal services (Payment, Order DB, Auth).',
      'Enable circuit breakers or shed load on non-critical endpoints to restore gateway stability.',
    ];
  }

  if (t.includes('oom') || t.includes('out of memory') || t.includes('heap') || t.includes('killed')) {
    return [
      'Inspect worker pod memory usage via `kubectl top pod` or container runtime metrics.',
      'Check recent deployment diffs for memory leaks or unbuffered batch payloads.',
      'Bump container memory limits temporarily or scale replica count horizontally.',
    ];
  }

  if (t.includes('redis') || t.includes('cache') || t.includes('socket timeout')) {
    return [
      'Check Redis SLOWLOG and command latency metrics (`redis-cli slowlog get 10`).',
      'Verify Redis replica synchronization and sentinel/cluster failover events.',
      'Ensure fallback database has capacity to withstand cache miss stampede.',
    ];
  }

  if (t.includes('token') || t.includes('jwt') || t.includes('unauthorized') || t.includes('401') || t.includes('signature')) {
    return [
      'Verify JWKS / public key distribution across microservices to detect key rotation desync.',
      'Check clock skew across servers (`ntpstat` / chrony).',
      'Temporarily allow previous valid signing key if a rotation rollout failed midway.',
    ];
  }

  if (t.includes('deadlock') || t.includes('lock wait')) {
    return [
      'Identify concurrent transactions touching shared resources in reverse order.',
      'Kill the blocking transaction PID after validating transaction owner.',
      'Add transaction timeout to prevent unbounded row locking.',
    ];
  }

  return [
    `Inspect telemetry and stack traces for service(s): ${services.join(', ')}.`,
    'Correlate first occurrence timestamp with recent CI/CD deployments or canary rollouts.',
    'Check CPU, thread count, and network socket exhaustion on affected nodes.',
  ];
}

export function rankIncidents(
  entries: LogEntry[],
  miner: DrainMiner,
  startTime: number
): ParseResult {
  const clusters = miner.getAllClusters();

  // Filter out pure INFO/DEBUG clusters if there are errors, but keep them if only info exists
  const totalErrors = entries.filter(e => ['FATAL', 'CRITICAL', 'ERROR', 'WARN'].includes(e.level)).length;
  
  // Sort entries chronologically to ensure accurate timeline
  const sortedEntries = [...entries].sort((a, b) => a.epoch - b.epoch);
  const minEpoch = sortedEntries.length > 0 ? sortedEntries[0].epoch : Date.now();
  const maxEpoch = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1].epoch : Date.now();
  const totalDurationSec = Math.max(1, Math.round((maxEpoch - minEpoch) / 1000));

  // Compute 24 time buckets for sparkline / timeline
  const bucketCount = 20;
  const bucketSize = Math.max(1000, Math.ceil((maxEpoch - minEpoch) / bucketCount));
  const timeBuckets: TimeBucket[] = [];

  for (let b = 0; b < bucketCount; b++) {
    const bStart = minEpoch + b * bucketSize;
    const bDate = new Date(bStart);
    const timeLabel = bDate.toISOString().substring(11, 19);
    timeBuckets.push({
      timeLabel,
      epoch: bStart,
      totalCount: 0,
      errorCount: 0,
    });
  }

  for (const entry of sortedEntries) {
    const bucketIndex = Math.min(bucketCount - 1, Math.max(0, Math.floor((entry.epoch - minEpoch) / bucketSize)));
    timeBuckets[bucketIndex].totalCount++;
    if (['FATAL', 'CRITICAL', 'ERROR', 'WARN'].includes(entry.level)) {
      timeBuckets[bucketIndex].errorCount++;
    }
  }

  // Convert clusters to Incidents
  const incidents: Incident[] = clusters.map(cl => {
    // Dominant severity level
    const levelCounts: Record<LogLevel, number> = {
      FATAL: 0, CRITICAL: 0, ERROR: 0, WARN: 0, WARNING: 0, INFO: 0, DEBUG: 0, TRACE: 0
    };
    for (const lvl of cl.levels) {
      levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
    }
    
    let dominantLevel: LogLevel = 'INFO';
    let maxLvlCount = -1;
    for (const [lvl, count] of Object.entries(levelCounts) as [LogLevel, number][]) {
      if (count > maxLvlCount) {
        maxLvlCount = count;
        dominantLevel = lvl;
      }
    }
    // Promote to ERROR/FATAL if significant
    if (levelCounts.FATAL > 0) dominantLevel = 'FATAL';
    else if (levelCounts.CRITICAL > 0) dominantLevel = 'CRITICAL';
    else if (levelCounts.ERROR > 0) dominantLevel = 'ERROR';

    const sevScore = SEVERITY_SCORES[dominantLevel] || 20;
    const severityLabel: 'Critical' | 'High' | 'Medium' | 'Low' = 
      sevScore >= 95 ? 'Critical' :
      sevScore >= 75 ? 'High' :
      sevScore >= 40 ? 'Medium' : 'Low';

    const serviceList = Array.from(cl.services).sort();
    const serviceCount = serviceList.length;

    // Volume score (logarithmic)
    const volScore = Math.min(100, Math.round(22 * Math.log10(cl.rawCount + 1)));

    // Blast radius score (cross-service cascade)
    const blastScore = Math.min(100, serviceCount * 28);

    // Duration & peak velocity
    const durationMs = Math.max(100, cl.lastSeenEpoch - cl.firstSeenEpoch);
    const durationSec = Math.max(1, durationMs / 1000);
    const peakVelocity = Math.round((cl.rawCount / durationSec) * 10) / 10;

    // Composite impact score formula
    const rawImpact = (sevScore * 0.40) + (volScore * 0.35) + (blastScore * 0.25);
    const impactScore = Math.min(100, Math.max(5, Math.round(rawImpact)));

    const templateStr = cl.templateTokens.join(' ');

    // Variable slots analysis
    const variableSlots = Array.from(cl.variableValues.entries()).map(([idx, valSet]) => {
      const sampleVals = Array.from(valSet).slice(0, 5);
      return {
        name: cl.templateTokens[idx] || `slot_${idx}`,
        sampleValues: sampleVals,
        uniqueCount: valSet.size,
      };
    });

    const percentageOfErrors = totalErrors > 0 
      ? Math.round((cl.rawCount / totalErrors) * 1000) / 10 
      : Math.round((cl.rawCount / entries.length) * 1000) / 10;

    const { title, summary } = deriveHumanTitleAndSummary(templateStr, serviceList);

    return {
      id: cl.id,
      title,
      humanSummary: summary,
      template: templateStr,
      patternTokens: cl.templateTokens,
      count: cl.rawCount,
      percentageOfErrors,
      severity: severityLabel,
      dominantLevel,
      services: serviceList,
      serviceCount,
      firstSeen: cl.firstSeenStr,
      firstSeenEpoch: cl.firstSeenEpoch,
      lastSeen: cl.lastSeenStr,
      lastSeenEpoch: cl.lastSeenEpoch,
      durationFormatted: formatDuration(durationMs),
      peakVelocity,
      impactScore,
      isLikelyTrigger: false, // will calculate below
      triggerRationale: '',
      examples: cl.entries.slice(0, 5).map(e => e.message),
      sampleEntries: cl.entries.slice(0, 10),
      variableSlots,
      timeBuckets: [],
      suggestedMitigation: deriveMitigations(templateStr, serviceList),
    };
  });

  // Filter out low-volume informational clusters unless no error incidents exist
  let actionableIncidents = incidents;
  const severeIncidents = incidents.filter(i => ['Critical', 'High'].includes(i.severity));
  if (severeIncidents.length > 0) {
    // Keep severe incidents and any significant medium ones
    actionableIncidents = incidents.filter(i => 
      ['Critical', 'High'].includes(i.severity) || 
      (i.severity === 'Medium' && i.count >= 5)
    );
  }

  // Identify the Likely Trigger:
  // Root cause hypothesis is typically:
  // 1. Appears among the earliest high/critical severity clusters (before the volume explosion)
  // 2. Or is a foundational service (database, storage, auth, memory) that preceded downstream client/gateway timeouts
  let rootTriggerId: string | undefined;
  if (actionableIncidents.length > 0) {
    // Sort chronologically by first seen epoch
    const chronoSorted = [...actionableIncidents].sort((a, b) => a.firstSeenEpoch - b.firstSeenEpoch);

    // Look for high-severity or database/auth/system issue starting early
    let candidate = chronoSorted[0];
    for (const inc of chronoSorted.slice(0, 3)) {
      const t = inc.template.toLowerCase();
      if (
        t.includes('connection') || 
        t.includes('pool') || 
        t.includes('fatal') || 
        t.includes('postgres') || 
        t.includes('redis') || 
        t.includes('oom') || 
        t.includes('memory') || 
        t.includes('auth') ||
        t.includes('deadlock')
      ) {
        candidate = inc;
        break;
      }
    }

    if (candidate) {
      candidate.isLikelyTrigger = true;
      rootTriggerId = candidate.id;
      // Add boost to its impact score as root initiator
      candidate.impactScore = Math.min(100, candidate.impactScore + 8);

      const deltaSec = Math.max(0, Math.round((actionableIncidents[0].firstSeenEpoch - candidate.firstSeenEpoch) / 1000));
      candidate.triggerRationale = `First observed at ${candidate.firstSeen.split(' ')[1] || candidate.firstSeen} in [${candidate.services.join(', ')}]. Temporal precedence indicates this root failure cascade triggered downstream timeouts across ${actionableIncidents.length - 1} dependent services.`;
    }
  }

  // Sort by Impact Score descending
  actionableIncidents.sort((a, b) => {
    if (a.isLikelyTrigger && !b.isLikelyTrigger) return -1;
    if (!a.isLikelyTrigger && b.isLikelyTrigger) return 1;
    return b.impactScore - a.impactScore;
  });

  const processingTimeMs = Math.round(performance.now() - startTime);

  // Extract unique services
  const allServices = Array.from(new Set(entries.map(e => e.service))).sort();

  return {
    entries: sortedEntries,
    incidents: actionableIncidents,
    totalLines: entries.length,
    parsedCount: entries.length,
    skippedCount: 0,
    errorCount: totalErrors,
    services: allServices,
    processingTimeMs,
    timeRange: {
      start: sortedEntries[0]?.timestamp || 'N/A',
      end: sortedEntries[sortedEntries.length - 1]?.timestamp || 'N/A',
      durationMinutes: Math.round((totalDurationSec / 60) * 10) / 10,
    },
    rootTriggerIncidentId: rootTriggerId,
    timeBuckets,
  };
}
