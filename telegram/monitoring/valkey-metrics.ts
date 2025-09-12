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

import { createClient } from 'redis';
import { Gauge } from 'prom-client';

export class ValkeyMetricsCollector {
  private client: ReturnType<typeof createClient> | null = null;
  private avgExecutionTimeGauge: Gauge<string>;
  private connected: boolean = false;
  private readonly METRICS_KEY_PREFIX = 'bot:metrics:';
  private readonly COMMAND_EXEC_KEY = 'command:execution:';
  private readonly ROLLING_WINDOW_SIZE = 100;

  constructor(avgExecutionTimeGauge: Gauge<string>) {
    this.avgExecutionTimeGauge = avgExecutionTimeGauge;
  }

  async connect(): Promise<void> {
    const { valkeyBaseUrl, valkeyPort } = process.env;
    if (!valkeyBaseUrl || !valkeyPort) {
      console.warn('[📊 MET] Valkey connection details not provided, metrics aggregation disabled');
      return;
    }

    try {
      const valkeyUrl = `redis://${valkeyBaseUrl}:${valkeyPort}`;
      this.client = createClient({ url: valkeyUrl });

      this.client.on('error', (err) => {
        console.error('[📊 MET] Valkey error:', err.message);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('[📊 MET] Connected to Valkey for metrics');
        this.connected = true;
      });

      await this.client.connect();
      await this.startMetricsUpdater();
    } catch (error) {
      console.error('[📊 MET] Failed to connect to Valkey:', error instanceof Error ? error.message : String(error));
      this.connected = false;
    }
  }

  async trackCommandExecution(command: string, chatType: string, duration: number): Promise<void> {
    if (!this.connected || !this.client) {
      return;
    }

    try {
      const key = `${this.METRICS_KEY_PREFIX}${this.COMMAND_EXEC_KEY}${command}:${chatType}`;

      await this.client.lPush(key, duration.toString());

      await this.client.lTrim(key, 0, this.ROLLING_WINDOW_SIZE - 1);

      await this.client.expire(key, 86400);
    } catch (error) {
      console.error('[📊 MET] Failed to track command execution:', error instanceof Error ? error.message : String(error));
    }
  }

  async getAverageExecutionTime(command: string, chatType: string): Promise<number | null> {
    if (!this.connected || !this.client) {
      return null;
    }

    try {
      const key = `${this.METRICS_KEY_PREFIX}${this.COMMAND_EXEC_KEY}${command}:${chatType}`;
      const values = await this.client.lRange(key, 0, -1);

      if (values.length === 0) {
        return null;
      }

      const durations = values.map(v => parseFloat(v));
      const average = durations.reduce((sum, val) => sum + val, 0) / durations.length;

      return average;
    } catch (error) {
      console.error('[📊 MET] Failed to get average execution time:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async getAllCommandAverages(): Promise<Map<string, number>> {
    const averages = new Map<string, number>();

    if (!this.connected || !this.client) {
      return averages;
    }

    try {
      const pattern = `${this.METRICS_KEY_PREFIX}${this.COMMAND_EXEC_KEY}*`;
      const keys = await this.client.keys(pattern);

      for (const key of keys) {
        const values = await this.client.lRange(key, 0, -1);
        if (values.length > 0) {
          const durations = values.map(v => parseFloat(v));
          const average = durations.reduce((sum, val) => sum + val, 0) / durations.length;

          const keyParts = key.replace(`${this.METRICS_KEY_PREFIX}${this.COMMAND_EXEC_KEY}`, '').split(':');
          const command = keyParts[0];
          const chatType = keyParts[1];
          const metricKey = `${command}_${chatType}`;

          averages.set(metricKey, average);
        }
      }
    } catch (error) {
      console.error('[📊 MET] Failed to get all command averages:', error instanceof Error ? error.message : String(error));
    }

    return averages;
  }

  private async startMetricsUpdater(): Promise<void> {
    const updateInterval = 30000;

    const updateMetrics = async () => {
      if (!this.connected) {
        return;
      }

      const averages = await this.getAllCommandAverages();

      for (const [key, average] of averages) {
        const [command, chatType] = key.split('_');
        this.avgExecutionTimeGauge.set(
          { command, chat_type: chatType },
          average / 1000
        );
      }
    };

    await updateMetrics();
    setInterval(updateMetrics, updateInterval);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
      console.log('[📊 MET] Disconnected from Valkey');
    }
  }
}