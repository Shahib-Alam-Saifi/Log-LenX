/**
 * High-fidelity production log datasets generator
 * Generates true 10,000-line realistic server & microservice logs
 * with authentic failure cascades, background traffic, and stack traces.
 */

import { PresetKey } from '../types/log';

function randomUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function randomIp(): string {
  return `10.${Math.floor(Math.random() * 40)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
}

function pad(num: number, size: number = 2): string {
  return String(num).padStart(size, '0');
}

function formatIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const h = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  const s = pad(date.getUTCSeconds());
  const ms = pad(date.getUTCMilliseconds(), 3);
  return `${y}-${m}-${d} ${h}:${min}:${s}.${ms}`;
}

export function generatePresetLogs(preset: PresetKey, targetCount: number = 10000): string {
  const lines: string[] = [];
  const baseTime = new Date('2026-10-09T02:45:00.000Z');
  let currentMillis = baseTime.getTime();

  // Failure event onset happens at roughly line 2,200 (around 02:58:02 UTC)
  const incidentOnsetLine = Math.floor(targetCount * 0.22);

  if (preset === 'payment_cascade') {
    // 3:00 AM Pager: Postgres connection starvation -> HikariCP pool timeout -> Payment 504 -> Gateway retry storm
    const normalEndpoints = ['/api/v1/products', '/api/v1/user/profile', '/healthz', '/metrics', '/api/v1/cart', '/api/v1/categories'];
    const services = ['ingress-nginx', 'checkout-gateway', 'payment-service', 'postgres-primary', 'worker-queue'];

    for (let i = 0; i < targetCount; i++) {
      // Time advances by 50ms - 300ms normally, or 10ms - 40ms during error burst
      const isPostOnset = i >= incidentOnsetLine;
      currentMillis += isPostOnset ? Math.floor(Math.random() * 40) + 10 : Math.floor(Math.random() * 220) + 50;
      const t = formatIso(new Date(currentMillis));
      const trace = randomUuid().slice(0, 8);

      if (!isPostOnset) {
        // Normal traffic (INFO / DEBUG / minor WARN)
        const roll = Math.random();
        if (roll < 0.60) {
          const ep = normalEndpoints[Math.floor(Math.random() * normalEndpoints.length)];
          const latency = Math.floor(Math.random() * 45) + 12;
          lines.push(`${t} INFO [ingress-nginx] [trace_id=${trace}] HTTP GET ${ep} status=200 duration=${latency}ms client_ip=${randomIp()}`);
        } else if (roll < 0.85) {
          lines.push(`${t} INFO [checkout-gateway] [trace_id=${trace}] Order state query dispatched for cart_id=${randomUuid()}`);
        } else if (roll < 0.95) {
          lines.push(`${t} DEBUG [worker-queue] Heartbeat ping ACK from worker-node-${Math.floor(Math.random() * 8) + 1}`);
        } else {
          lines.push(`${t} WARN [payment-service] Client socket keepalive packet delayed by ${Math.floor(Math.random() * 120) + 80}ms`);
        }
      } else {
        // Disaster unfolds in strict cascading order!
        const postIndex = i - incidentOnsetLine;
        const roll = Math.random();

        // Wave 1: The Root Initiator (Postgres connection pool exhausted)
        if (postIndex < 800 || roll < 0.35) {
          const poolActive = 100;
          const waiting = Math.floor(Math.random() * 280) + 120;
          lines.push(`${t} FATAL [postgres-primary] [trace_id=${trace}] remaining connection slots are reserved for non-replication superuser connections (max_connections=${poolActive} reached, waiting=${waiting})`);
          if (Math.random() < 0.08) {
            lines.push(`    at org.postgresql.core.v3.ConnectionFactoryImpl.openConnectionImpl(ConnectionFactoryImpl.java:319)`);
            lines.push(`    at org.postgresql.core.ConnectionFactory.openConnection(ConnectionFactoryImpl.java:54)`);
            lines.push(`    Caused by: org.postgresql.util.PSQLException: FATAL: remaining connection slots are reserved`);
          }
        } 
        // Wave 2: Payment Service HikariPool timeout
        else if (roll < 0.65) {
          const timeout = 30000 + Math.floor(Math.random() * 50);
          lines.push(`${t} ERROR [payment-service] [trace_id=${trace}] HikariPool-1 - Connection is not available, request timed out after ${timeout}ms (active=100, idle=0, waiting=${Math.floor(Math.random() * 300) + 80})`);
          if (Math.random() < 0.05) {
            lines.push(`    at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:182)`);
            lines.push(`    at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:147)`);
            lines.push(`    at com.ecommerce.payment.service.TransactionManager.charge(TransactionManager.java:88)`);
          }
        } 
        // Wave 3: Checkout Gateway 504 Gateway Timeout
        else if (roll < 0.85) {
          lines.push(`${t} CRITICAL [checkout-gateway] [trace_id=${trace}] Upstream payment processing failed with 504 Gateway Timeout for order_id=${randomUuid()}`);
        } 
        // Wave 4: Ingress retry storm
        else if (roll < 0.95) {
          lines.push(`${t} WARN [ingress-nginx] [trace_id=${trace}] Retry attempt ${Math.floor(Math.random() * 3) + 1}/3 exhausted for customer=${randomUuid()} upstream_addr=${randomIp()}:8443`);
        } 
        // Background noise amidst disaster
        else {
          lines.push(`${t} INFO [ingress-nginx] [trace_id=${trace}] HTTP GET /healthz status=200 duration=2ms client_ip=127.0.0.1`);
        }
      }
    }
  } else if (preset === 'k8s_oom') {
    // K8s OOMKilled worker nodes & pod crashloop
    for (let i = 0; i < targetCount; i++) {
      currentMillis += (i >= incidentOnsetLine ? 15 : 180);
      const t = formatIso(new Date(currentMillis));
      const trace = randomUuid().slice(0, 8);

      if (i < incidentOnsetLine) {
        lines.push(`${t} INFO [kubelet] Successfully pulled container image "analytics-worker:v2.14.0" in 412ms`);
      } else {
        const roll = Math.random();
        if (roll < 0.40) {
          lines.push(`${t} FATAL [kernel] [node-worker-${Math.floor(Math.random() * 4) + 1}] Out of memory: Killed process ${Math.floor(Math.random() * 4000) + 1000} (python3) total-vm:${Math.floor(Math.random() * 2000) + 3800}MB, anon-rss:${Math.floor(Math.random() * 1000) + 3500}MB`);
        } else if (roll < 0.70) {
          lines.push(`${t} ERROR [kubelet] Container "worker" in pod "analytics-worker-${randomUuid().slice(0, 5)}" failed liveness probe, restarting container (exitCode=137 OOMKilled)`);
        } else if (roll < 0.90) {
          lines.push(`${t} CRITICAL [api-gateway] gRPC transport stream closed prematurely: connection reset by peer from worker pod ip=${randomIp()}`);
        } else {
          lines.push(`${t} WARN [scheduler] Pod eviction warning triggered on node-worker-${Math.floor(Math.random() * 4) + 1}: memory pressure threshold exceeded`);
        }
      }
    }
  } else if (preset === 'auth_desync') {
    // JWT key rotation mismatch
    for (let i = 0; i < targetCount; i++) {
      currentMillis += (i >= incidentOnsetLine ? 20 : 190);
      const t = formatIso(new Date(currentMillis));
      const trace = randomUuid().slice(0, 8);

      if (i < incidentOnsetLine) {
        lines.push(`${t} INFO [auth-service] User session validated for account_id=${randomUuid().slice(0, 8)}`);
      } else {
        const roll = Math.random();
        if (roll < 0.45) {
          lines.push(`${t} CRITICAL [auth-service] [trace_id=${trace}] JWT signature verification failed: key ID "kid-2026-q4" not present in local JWKS cache`);
        } else if (roll < 0.75) {
          lines.push(`${t} ERROR [api-gateway] [trace_id=${trace}] HTTP 401 Unauthorized returned to client ip=${randomIp()} for path=/api/v2/secure/profile`);
        } else if (roll < 0.92) {
          lines.push(`${t} WARN [client-sdk] Refresh token stampede detected: 14 concurrent refreshes queued for user_id=${randomUuid().slice(0, 8)}`);
        } else {
          lines.push(`${t} INFO [auth-service] Attempting JWKS cache refresh from https://idp.internal/.well-known/jwks.json`);
        }
      }
    }
  } else {
    // Redis partition
    for (let i = 0; i < targetCount; i++) {
      currentMillis += (i >= incidentOnsetLine ? 25 : 200);
      const t = formatIso(new Date(currentMillis));
      const trace = randomUuid().slice(0, 8);

      if (i < incidentOnsetLine) {
        lines.push(`${t} INFO [cache-proxy] Redis GET session:${randomUuid().slice(0, 6)} cache_hit=true latency=1.2ms`);
      } else {
        const roll = Math.random();
        if (roll < 0.45) {
          lines.push(`${t} FATAL [redis-sentinel] Node redis-master-01 failed heartbeat check: ping timeout after 5000ms (state=SDOWN)`);
        } else if (roll < 0.75) {
          lines.push(`${t} ERROR [cache-proxy] [trace_id=${trace}] Redis command failed with JedisConnectionException: Could not get a resource from the pool`);
        } else if (roll < 0.90) {
          lines.push(`${t} CRITICAL [user-service] [trace_id=${trace}] Cache miss fallback query queue saturated: 480 pending database queries waiting`);
        } else {
          lines.push(`${t} WARN [ingress-nginx] Upstream response latency degraded: 99th percentile at ${Math.floor(Math.random() * 2000) + 3200}ms`);
        }
      }
    }
  }

  return lines.join('\n');
}

export const PRESET_METADATA: Record<PresetKey, { title: string; subtitle: string; lines: number; severity: string; services: string[] }> = {
  payment_cascade: {
    title: '3:00 AM Payment Cascade',
    subtitle: 'Postgres connection starvation → HikariCP timeout → Gateway 504 storm',
    lines: 10000,
    severity: 'Critical',
    services: ['postgres-primary', 'payment-service', 'checkout-gateway', 'ingress-nginx', 'worker-queue'],
  },
  k8s_oom: {
    title: 'Kubernetes OOMKilled Cascade',
    subtitle: 'Node memory pressure → Analytics worker exitCode 137 → gRPC stream reset',
    lines: 10000,
    severity: 'Critical',
    services: ['kernel', 'kubelet', 'api-gateway', 'scheduler'],
  },
  auth_desync: {
    title: 'JWKS Key Rotation Desync',
    subtitle: 'Key ID mismatch → 401 Unauthorized tsunami → Client refresh token stampede',
    lines: 10000,
    severity: 'High',
    services: ['auth-service', 'api-gateway', 'client-sdk'],
  },
  redis_partition: {
    title: 'Redis Sentinel Failover Split',
    subtitle: 'Master node SDOWN → Jedis pool exhaustion → DB query queue saturation',
    lines: 10000,
    severity: 'High',
    services: ['redis-sentinel', 'cache-proxy', 'user-service', 'ingress-nginx'],
  },
};
