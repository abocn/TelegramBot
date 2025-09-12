// This is free and unencumbered software released into the public domain.
//
// Anyone is free to copy, modify, publish, use, compile, sell, or
// distribute this software, either in source code form or as a compiled
// binary, for any purpose, commercial or non-commercial, and by any
// means.
//
// In jurisdictions that recognize copyright laws, the author or authors
// of this software dedicate any and all copyright interest in the
// software to the public domain. We make this dedication for the benefit
// of the public at large and to the detriment of our heirs and
// successors. We intend this dedication to be an overt act of
// relinquishment in perpetuity of all present and future rights to this
// software under copyright law.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
// OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.
//
// For more information, please refer to <https://unlicense.org/>

import { register, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';
import { ValkeyMetricsCollector } from './valkey-metrics';

collectDefaultMetrics({ register });

export const botUptime = new Gauge({
  name: 'telegram_bot_up',
  help: 'Bot uptime status (1=up, 0=down)',
  registers: [register]
});

export const commandTotal = new Counter({
  name: 'telegram_commands_total',
  help: 'Total number of commands executed',
  labelNames: ['command', 'chat_type', 'status'],
  registers: [register]
});

export const commandDuration = new Histogram({
  name: 'telegram_command_duration_seconds',
  help: 'Command execution time in seconds',
  labelNames: ['command', 'chat_type'],
  buckets: [0.01, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
  registers: [register]
});

export const commandAvgDuration = new Gauge({
  name: 'telegram_command_avg_duration_seconds',
  help: 'Average command execution time in seconds (rolling window)',
  labelNames: ['command', 'chat_type'],
  registers: [register]
});

export const telegramApiErrors = new Counter({
  name: 'telegram_api_errors_total',
  help: 'Total number of Telegram API errors',
  labelNames: ['error_code', 'error_type'],
  registers: [register]
});

export const databaseConnectionStatus = new Gauge({
  name: 'database_connection_status',
  help: 'Database connection status (1=connected, 0=disconnected)',
  registers: [register]
});

export const valkeyConnectionStatus = new Gauge({
  name: 'valkey_connection_status',
  help: 'Valkey/Redis connection status (1=connected, 0=disconnected)',
  registers: [register]
});

export const activeUsers = new Gauge({
  name: 'telegram_active_users',
  help: 'Number of active users in the last 24 hours',
  registers: [register]
});

export const activeUsersGauge = activeUsers;
export const commandTotalGauge = commandTotal;
export const botUpGauge = botUptime;
export const databaseConnectionGauge = databaseConnectionStatus;
export const valkeyConnectionGauge = valkeyConnectionStatus;

export const botErrors = new Counter({
  name: 'telegram_bot_errors_total',
  help: 'Total number of bot application errors',
  labelNames: ['error_type', 'command'],
  registers: [register]
});

export const webhookStatus = new Gauge({
  name: 'telegram_webhook_status',
  help: 'Telegram webhook status (1=active, 0=inactive)',
  registers: [register]
});

export const memoryUsage = new Gauge({
  name: 'bot_memory_usage_bytes',
  help: 'Bot memory usage in bytes',
  labelNames: ['type'],
  registers: [register]
});

export const startupTime = new Gauge({
  name: 'bot_startup_timestamp_seconds',
  help: 'Unix timestamp when the bot started',
  registers: [register]
});

let valkeyCollector: ValkeyMetricsCollector | null = null;

export async function initializeMetrics() {
  botUptime.set(1);
  startupTime.set(Date.now() / 1000);

  const updateMemoryMetrics = () => {
    const memUsage = process.memoryUsage();
    memoryUsage.set({ type: 'rss' }, memUsage.rss);
    memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
    memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
    memoryUsage.set({ type: 'external' }, memUsage.external);
  };

  updateMemoryMetrics();
  setInterval(updateMemoryMetrics, 30000);

  valkeyCollector = new ValkeyMetricsCollector(commandAvgDuration);
  await valkeyCollector.connect();
}

export async function shutdownMetrics() {
  botUptime.set(0);
  if (valkeyCollector) {
    await valkeyCollector.disconnect();
  }
}

export function getValkeyCollector(): ValkeyMetricsCollector | null {
  return valkeyCollector;
}

export { register };