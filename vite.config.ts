import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import * as backend from './src/api/backendEngine';

function apiBackendPlugin(): Plugin {
  return {
    name: 'api-backend-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost:3000');
        const pathname = url.pathname;

        const sendJson = (data: any, status = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
        };

        if (pathname === '/api/health') {
          return sendJson(backend.getHealth());
        }

        if (pathname === '/api/status') {
          return sendJson(backend.getStatus());
        }

        if (pathname === '/api/incidents') {
          return sendJson(backend.getIncidents());
        }

        if (pathname === '/api/services') {
          return sendJson(backend.getServices());
        }

        if (pathname === '/api/alerts') {
          return sendJson(backend.getAlerts());
        }

        if (pathname === '/api/integrations') {
          return sendJson(backend.getIntegrations());
        }

        if (pathname === '/api/settings') {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const out = backend.updateSettings(parsed.config, parsed.environment);
                sendJson(out);
              } catch (e: any) {
                sendJson({ error: e.message }, 400);
              }
            });
            return;
          }
          return sendJson(backend.getSettings());
        }

        if (pathname === '/api/logs/analyze') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const out = backend.analyzeLogs(parsed);
              sendJson(out);
            } catch (e: any) {
              sendJson({ error: e.message }, 400);
            }
          });
          return;
        }

        if (pathname === '/api/export') {
          return sendJson(backend.getExportReport());
        }

        return next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiBackendPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
