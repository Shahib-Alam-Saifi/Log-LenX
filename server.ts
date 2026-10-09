/**
 * Full-Stack Observability Backend Server for Log Lenx.
 * Runs on Port 3000, serving both the REST API and Vite SPA middlewares.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as backend from './src/api/backendEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- REST API ENDPOINTS ---

// Health & System status
app.get('/api/health', (req, res) => {
  res.json(backend.getHealth());
});

// Overview Stats KPI
app.get('/api/status', (req, res) => {
  res.json(backend.getStatus());
});

// Full Analysis Endpoint
app.post('/api/logs/analyze', (req, res) => {
  const result = backend.analyzeLogs(req.body);
  res.json(result);
});

// Get Incidents
app.get('/api/incidents', (req, res) => {
  res.json(backend.getIncidents());
});

// Resolve an Incident with remediation action
app.post('/api/incidents/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { notes, resolvedBy } = req.body || {};
  const result = backend.resolveIncident(id, notes, resolvedBy);
  res.json(result);
});

// Reopen an Incident
app.post('/api/incidents/:id/reopen', (req, res) => {
  const { id } = req.params;
  const result = backend.reopenIncident(id);
  res.json(result);
});

// Get Microservices Pulse & Uptime
app.get('/api/services', (req, res) => {
  res.json(backend.getServices());
});

// Alerts Configuration & Triggers
app.get('/api/alerts', (req, res) => {
  res.json(backend.getAlerts());
});

// Integrations
app.get('/api/integrations', (req, res) => {
  res.json(backend.getIntegrations());
});

// Settings & Config
app.get('/api/settings', (req, res) => {
  res.json(backend.getSettings());
});

app.post('/api/settings', (req, res) => {
  const { config, environment } = req.body;
  const result = backend.updateSettings(config, environment);
  res.json(result);
});

// Export incident report
app.get('/api/export', (req, res) => {
  res.json(backend.getExportReport());
});

// --- VITE MIDDLEWARES / STATIC ASSETS ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Log Lenx Server] Operational and listening on port ${PORT}`);
  });
}

startServer();
