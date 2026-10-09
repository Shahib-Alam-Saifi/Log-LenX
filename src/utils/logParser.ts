/**
 * High-performance Log Parser
 * Parses diverse log styles (ISO, RFC3339, Syslog, JSON, bracketed, trace-tagged)
 * and folds multi-line stack traces automatically.
 */

import { LogEntry, LogLevel } from '../types/log';

const LEVEL_MAP: Record<string, LogLevel> = {
  FATAL: 'FATAL',
  CRITICAL: 'CRITICAL',
  CRIT: 'CRITICAL',
  ERROR: 'ERROR',
  ERR: 'ERROR',
  WARNING: 'WARN',
  WARN: 'WARN',
  INFO: 'INFO',
  INFORMATION: 'INFO',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE',
};

// Regex patterns for line matching
interface ExtractedLog {
  time: string;
  level: string;
  service: string;
  message: string;
  traceId?: string;
}

const PATTERNS: { regex: RegExp; extract: (m: RegExpMatchArray) => ExtractedLog }[] = [
  // 1. ISO/Standard: 2026-10-09 02:58:01.123 ERROR [service] message
  // or 2026-10-09T02:58:01Z [ERROR] service: message
  {
    regex: /^(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+\[?([A-Z]{3,8})\]?\s+(?:\[?([\w.\-/]+)\]?[:\s]+)?(?:\[(?:trace_id=)?([a-f0-9-]+)\]\s+)?(.*)$/i,
    extract: (m: RegExpMatchArray): ExtractedLog => ({
      time: m[1],
      level: m[2],
      service: m[3] || 'app',
      traceId: m[4],
      message: m[5],
    }),
  },
  // 2. Bracketed level first: [ERROR] 2026-10-09 02:58:01 [service] message
  {
    regex: /^\[([A-Z]{3,8})\]\s+(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)\s+(?:\[?([\w.\-/]+)\]?[:\s]+)?(.*)$/i,
    extract: (m: RegExpMatchArray): ExtractedLog => ({
      time: m[2],
      level: m[1],
      service: m[3] || 'app',
      traceId: undefined,
      message: m[4],
    }),
  },
  // 3. Syslog style: Oct 09 02:58:01 host service[123]: [ERROR] message
  {
    regex: /^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+[\w.-]+\s+([\w.\-/]+)(?:\[\d+\])?:\s+(?:\[?([A-Z]{3,8})\]?\s+)?(.*)$/i,
    extract: (m: RegExpMatchArray): ExtractedLog => ({
      time: m[1],
      level: m[3] || 'INFO',
      service: m[2] || 'syslog',
      traceId: undefined,
      message: m[4],
    }),
  },
];

const STACK_TRACE_PREFIXES = [
  /^\s+at\s+/,
  /^\s+File\s+"/,
  /^Caused by:/,
  /^\s+\.\.\.\s+\d+\s+more/,
  /^\s+org\./,
  /^\s+com\./,
  /^\s+java\./,
  /^Traceback \(most recent call last\):/,
  /^\s+raise\s+/,
  /^\s+goroutine\s+\d+/,
];

function isStackTraceLine(line: string): boolean {
  return STACK_TRACE_PREFIXES.some(prefix => prefix.test(line));
}

function parseTimestampEpoch(timeStr: string): number {
  if (!timeStr) return Date.now();
  // Standardize comma to dot for millis
  const clean = timeStr.replace(',', '.');
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) return parsed;

  // Handle syslog like "Oct 09 02:58:01"
  const currentYear = new Date().getFullYear();
  const syslogParsed = Date.parse(`${currentYear} ${clean}`);
  if (!isNaN(syslogParsed)) return syslogParsed;

  return Date.now();
}

/**
 * Parses raw log text or lines into structured LogEntry array
 */
export function parseRawLogs(rawText: string): { entries: LogEntry[]; skippedLines: number } {
  const lines = rawText.split(/\r?\n/);
  const entries: LogEntry[] = [];
  let skippedLines = 0;
  let lineIdx = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    // Check if this line is a stack trace continuation of the previous entry
    if (entries.length > 0 && isStackTraceLine(rawLine)) {
      const prev = entries[entries.length - 1];
      if (!prev.stackTrace) {
        prev.stackTrace = [];
      }
      if (prev.stackTrace.length < 25) {
        prev.stackTrace.push(rawLine);
      }
      continue;
    }

    // Try parsing as JSON first
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const json = JSON.parse(trimmed);
        const timeStr = json.timestamp || json.time || json['@timestamp'] || new Date().toISOString();
        const rawLevel = String(json.level || json.severity || json.log_level || 'INFO').toUpperCase();
        const level: LogLevel = LEVEL_MAP[rawLevel] || 'INFO';
        const service = String(json.service || json.app || json.logger || json.component || 'app').trim();
        const message = String(json.message || json.msg || json.error || json.err || JSON.stringify(json)).trim();
        const traceId = json.traceId || json.trace_id || json.requestId || json.request_id;

        entries.push({
          id: `log-${lineIdx++}`,
          raw: rawLine,
          timestamp: timeStr,
          epoch: parseTimestampEpoch(timeStr),
          level,
          service,
          message,
          traceId: traceId ? String(traceId) : undefined,
          stackTrace: json.stack ? String(json.stack).split('\n') : undefined,
        });
        continue;
      } catch {
        // Fall through to regex parser
      }
    }

    // Try regex patterns
    let matched = false;
    for (const pat of PATTERNS) {
      const match = trimmed.match(pat.regex);
      if (match) {
        const extracted = pat.extract(match);
        const rawLevel = (extracted.level || 'INFO').toUpperCase();
        const level: LogLevel = LEVEL_MAP[rawLevel] || (rawLevel.includes('ERR') ? 'ERROR' : 'INFO');
        const service = (extracted.service || 'unknown-service').replace(/^[\[:]+|[\]:]+$/g, '').trim();

        entries.push({
          id: `log-${lineIdx++}`,
          raw: rawLine,
          timestamp: extracted.time,
          epoch: parseTimestampEpoch(extracted.time),
          level,
          service: service || 'service',
          message: extracted.message || trimmed,
          traceId: extracted.traceId,
        });
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Fallback heuristics: check if it contains ERROR / WARN / FATAL
      let detectedLevel: LogLevel = 'INFO';
      const upper = trimmed.toUpperCase();
      if (upper.includes('FATAL')) detectedLevel = 'FATAL';
      else if (upper.includes('CRITICAL')) detectedLevel = 'CRITICAL';
      else if (upper.includes('ERROR')) detectedLevel = 'ERROR';
      else if (upper.includes('WARN')) detectedLevel = 'WARN';
      else if (upper.includes('DEBUG')) detectedLevel = 'DEBUG';

      // Extract bracketed service if present like [checkout]
      const serviceMatch = trimmed.match(/\[([a-zA-Z0-9_-]+)\]/);
      const service = serviceMatch ? serviceMatch[1] : 'system';

      entries.push({
        id: `log-${lineIdx++}`,
        raw: rawLine,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        epoch: Date.now(),
        level: detectedLevel,
        service,
        message: trimmed,
      });
      skippedLines++;
    }
  }

  return { entries, skippedLines };
}
