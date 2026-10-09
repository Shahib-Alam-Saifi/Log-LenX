/**
 * Drain Log Clustering Engine
 * 
 * Implements online template mining inspired by the Drain algorithm
 * (Pinjia He et al., IEEE ICWS) to cluster high-volume log messages into
 * semantic templates without manual regex or hardcoded rules.
 */

import { LogEntry, LogLevel, Incident, VariableSlot, ClusteringConfig, DEFAULT_CLUSTERING_CONFIG } from '../types/log';

interface DrainNode {
  key: string;
  children: Map<string, DrainNode>;
  clusters: LogCluster[];
}

interface LogCluster {
  id: string;
  templateTokens: string[];
  rawCount: number;
  services: Set<string>;
  levels: LogLevel[];
  entries: LogEntry[];
  firstSeenEpoch: number;
  lastSeenEpoch: number;
  firstSeenStr: string;
  lastSeenStr: string;
  variableValues: Map<number, Set<string>>; // tokenIndex -> set of distinct values
}

export class DrainMiner {
  private depth: number;
  private similarityThreshold: number;
  private maxChildren: number;
  private root: DrainNode;
  private nextClusterId: number;
  private config: ClusteringConfig;

  constructor(config: Partial<ClusteringConfig> = {}) {
    this.config = { ...DEFAULT_CLUSTERING_CONFIG, ...config };
    this.depth = this.config.depth;
    this.similarityThreshold = this.config.similarityThreshold;
    this.maxChildren = this.config.maxChildren;
    this.root = { key: 'root', children: new Map(), clusters: [] };
    this.nextClusterId = 1;
  }

  /**
   * Tokenize log message into words and identify dynamic variables
   */
  public tokenize(message: string): string[] {
    if (!message) return ['<EMPTY>'];
    // Clean extra whitespace
    const clean = message.trim();
    // Split by spaces, equals, commas, colons while keeping sensible tokens
    return clean.split(/\s+/).filter(Boolean);
  }

  /**
   * Normalize token to generic variable placeholder if obviously dynamic
   */
  public normalizeToken(token: string): string {
    // UUID v4
    if (this.config.normalizeUuids && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
      return '<UUID>';
    }
    // IPv4 address
    if (this.config.normalizeIps && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(token)) {
      return '<IP>';
    }
    // Hex hash or memory address
    if (this.config.normalizeHex && (/^0x[0-9a-f]+$/i.test(token) || /^[0-9a-f]{16,}$/i.test(token))) {
      return '<HEX>';
    }
    // Numeric value with optional unit
    if (this.config.normalizeNumbers && /^[-+]?\d+(\.\d+)?(ms|s|us|kb|mb|gb|b|%|px)?$/i.test(token)) {
      return '<NUM>';
    }
    // ISO Timestamp
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(token)) {
      return '<TIME>';
    }
    // URI path with IDs
    if (/^\/[a-zA-Z0-9_\-\/]*\d+[a-zA-Z0-9_\-\/]*$/.test(token)) {
      return '<PATH>';
    }
    // Key=value with dynamic value
    if (token.includes('=')) {
      const [k, v] = token.split('=', 2);
      if (v && (/^\d+$/.test(v) || /^[0-9a-f-]{8,}$/i.test(v))) {
        return `${k}=<VAR>`;
      }
    }
    return token;
  }

  /**
   * Check if token is a wildcard or dynamic placeholder
   */
  private isWildcard(token: string): boolean {
    return token.startsWith('<') && token.endsWith('>');
  }

  /**
   * Calculate similarity between message tokens and template tokens
   */
  private computeSimilarity(msgTokens: string[], templateTokens: string[]): { sim: number; matchedCount: number } {
    if (msgTokens.length !== templateTokens.length) {
      return { sim: 0, matchedCount: 0 };
    }

    let matched = 0;
    for (let i = 0; i < msgTokens.length; i++) {
      const mt = msgTokens[i];
      const tt = templateTokens[i];

      if (this.isWildcard(tt)) {
        matched++;
      } else if (mt === tt) {
        matched++;
      } else if (this.normalizeToken(mt) === tt) {
        matched++;
      }
    }

    return { sim: matched / msgTokens.length, matchedCount: matched };
  }

  /**
   * Add a log entry into the Drain tree and return its assigned cluster
   */
  public addEntry(entry: LogEntry): LogCluster {
    const rawTokens = this.tokenize(entry.message);
    const normalizedTokens = rawTokens.map(t => this.normalizeToken(t));
    const tokenLength = normalizedTokens.length;

    // Traverse Drain Tree
    // Layer 1: Token length
    const lenKey = String(tokenLength);
    if (!this.root.children.has(lenKey)) {
      this.root.children.set(lenKey, { key: lenKey, children: new Map(), clusters: [] });
    }
    let currentNode = this.root.children.get(lenKey)!;

    // Layer 2 to depth: Leading tokens
    const maxPrefixDepth = Math.min(this.depth - 1, tokenLength);
    for (let i = 0; i < maxPrefixDepth; i++) {
      let tokenKey = normalizedTokens[i];
      // If token is dynamic, group under wildcard node to prevent fanout
      if (this.isWildcard(tokenKey) || /^\d+$/.test(tokenKey)) {
        tokenKey = '<*>';
      }

      if (!currentNode.children.has(tokenKey)) {
        if (currentNode.children.size >= this.maxChildren) {
          tokenKey = '<*>';
        }
        if (!currentNode.children.has(tokenKey)) {
          currentNode.children.set(tokenKey, { key: tokenKey, children: new Map(), clusters: [] });
        }
      }
      currentNode = currentNode.children.get(tokenKey)!;
    }

    // Now find the best matching cluster in the leaf node
    let bestCluster: LogCluster | null = null;
    let maxSim = -1;

    for (const cluster of currentNode.clusters) {
      const { sim } = this.computeSimilarity(normalizedTokens, cluster.templateTokens);
      if (sim > maxSim && sim >= this.similarityThreshold) {
        maxSim = sim;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      // Update template tokens (divergent tokens become wildcards)
      for (let i = 0; i < normalizedTokens.length; i++) {
        const curTok = normalizedTokens[i];
        const templateTok = bestCluster.templateTokens[i];

        if (curTok !== templateTok && !this.isWildcard(templateTok)) {
          const norm = this.normalizeToken(curTok);
          bestCluster.templateTokens[i] = this.isWildcard(norm) ? norm : '<*>';
        }

        // Track variable values
        if (this.isWildcard(bestCluster.templateTokens[i]) || curTok !== templateTok) {
          if (!bestCluster.variableValues.has(i)) {
            bestCluster.variableValues.set(i, new Set());
          }
          const valSet = bestCluster.variableValues.get(i)!;
          if (valSet.size < 50) {
            valSet.add(rawTokens[i] || curTok);
          }
        }
      }

      // Update cluster statistics
      bestCluster.rawCount++;
      bestCluster.services.add(entry.service);
      bestCluster.levels.push(entry.level);
      if (bestCluster.entries.length < 50) {
        bestCluster.entries.push(entry);
      }
      if (entry.epoch < bestCluster.firstSeenEpoch) {
        bestCluster.firstSeenEpoch = entry.epoch;
        bestCluster.firstSeenStr = entry.timestamp;
      }
      if (entry.epoch > bestCluster.lastSeenEpoch) {
        bestCluster.lastSeenEpoch = entry.epoch;
        bestCluster.lastSeenStr = entry.timestamp;
      }

      entry.clusterId = bestCluster.id;
      return bestCluster;
    }

    // No matching cluster found: create new cluster
    const newCluster: LogCluster = {
      id: `INC-${String(this.nextClusterId++).padStart(3, '0')}`,
      templateTokens: [...normalizedTokens],
      rawCount: 1,
      services: new Set([entry.service]),
      levels: [entry.level],
      entries: [entry],
      firstSeenEpoch: entry.epoch,
      lastSeenEpoch: entry.epoch,
      firstSeenStr: entry.timestamp,
      lastSeenStr: entry.timestamp,
      variableValues: new Map(),
    };

    currentNode.clusters.push(newCluster);
    entry.clusterId = newCluster.id;
    return newCluster;
  }

  /**
   * Collect all clusters from tree
   */
  public getAllClusters(): LogCluster[] {
    const results: LogCluster[] = [];

    const traverse = (node: DrainNode) => {
      for (const cl of node.clusters) {
        results.push(cl);
      }
      for (const child of node.children.values()) {
        traverse(child);
      }
    };

    traverse(this.root);
    return results;
  }
}
