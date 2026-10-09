/**
 * Core Orchestrator for Log Parsing, Clustering, and Incident Ranking
 */

import { parseRawLogs } from './logParser';
import { DrainMiner } from './drainEngine';
import { rankIncidents } from './impactRanker';
import { ParseResult, ClusteringConfig, DEFAULT_CLUSTERING_CONFIG } from '../types/log';

export async function processLogsAsync(
  rawText: string,
  onProgress?: (percent: number, stepText: string) => void,
  config: ClusteringConfig = DEFAULT_CLUSTERING_CONFIG
): Promise<ParseResult> {
  const t0 = performance.now();

  onProgress?.(15, 'Ingesting & parsing raw log stream...');
  // Allow UI frame to breathe
  await new Promise(r => setTimeout(r, 10));

  const { entries, skippedLines } = parseRawLogs(rawText);

  onProgress?.(50, `Mining error patterns across ${entries.length.toLocaleString()} log entries...`);
  await new Promise(r => setTimeout(r, 10));

  const miner = new DrainMiner(config);

  // Group entries through DrainMiner
  // Only cluster warnings, errors, fatals, and a representative slice of info if needed
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    // We cluster all entries, but prioritize errors
    miner.addEntry(entry);
  }

  onProgress?.(85, 'Ranking blast radius and calculating root trigger causal sequence...');
  await new Promise(r => setTimeout(r, 10));

  const result = rankIncidents(entries, miner, t0);
  result.skippedCount = skippedLines;

  onProgress?.(100, 'Analysis complete');
  return result;
}
