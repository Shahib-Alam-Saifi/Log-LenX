/**
 * Observability REST API Client for Log Lenx.
 * Connects to the backend Express / Vite API endpoints.
 * Automatically falls back to in-memory processing if offline or static SPA.
 */

import { ClusteringConfig, PresetKey, ParseResult, Incident } from '../types/log';
import * as backend from '../api/backendEngine';

export interface SystemStatusData {
  observedEvents: string;
  rawObservedCount: number;
  totalLogs: number;
  activeIncidents: string;
  rawIncidentCount: number;
  criticalIncidents: string;
  rawCriticalCount: number;
  observedServices: string;
  rawServiceCount: number;
  processingTimeMs: number;
  environment: string;
}

export const apiClient = {
  async getHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return backend.getHealth();
  },

  async getStatus(): Promise<SystemStatusData> {
    try {
      const res = await fetch('/api/status');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return backend.getStatus();
  },

  async getIncidents(): Promise<{ incidents: Incident[]; total: number; rootTriggerId?: string }> {
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return backend.getIncidents();
  },

  async resolveIncident(id: string, notes?: string, resolvedBy: string = 'On-Call SRE') {
    try {
      const res = await fetch(`/api/incidents/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, resolvedBy }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return backend.resolveIncident(id, notes, resolvedBy);
  },

  async reopenIncident(id: string) {
    try {
      const res = await fetch(`/api/incidents/${id}/reopen`, {
        method: 'POST',
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return backend.reopenIncident(id);
  },

  async getServices() {
    try {
      const res = await fetch('/api/services');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return backend.getServices();
  },

  async getAlerts() {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return backend.getAlerts();
  },

  async getIntegrations() {
    try {
      const res = await fetch('/api/integrations');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return backend.getIntegrations();
  },

  async getSettings() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return backend.getSettings();
  },

  async updateSettings(config?: Partial<ClusteringConfig>, environment?: string) {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, environment }),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return backend.updateSettings(config, environment);
  },

  async analyzeLogs(params: {
    rawText?: string;
    presetKey?: PresetKey;
    config?: Partial<ClusteringConfig>;
  }): Promise<ParseResult> {
    try {
      const res = await fetch('/api/logs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return backend.analyzeLogs(params);
  },

  async getExportReport() {
    try {
      const res = await fetch('/api/export');
      if (res.ok) return await res.json();
    } catch {
      // fallback
    }
    return backend.getExportReport();
  },
};
