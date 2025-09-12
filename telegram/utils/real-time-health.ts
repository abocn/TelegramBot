import { createClient } from 'redis';
import { Client } from 'pg';
import { Telegraf } from 'telegraf';
import {
  botUptime,
  databaseConnectionGauge,
  valkeyConnectionGauge
} from '../monitoring/metrics';

/**
 * Perform real-time health checks independently of HealthRecorder
 */
export async function performLiveHealthCheck() {
  const botIsUp = await checkBotStatus();
  botUptime.set(botIsUp ? 1 : 0);

  const dbConnected = await checkDatabaseConnection();
  databaseConnectionGauge.set(dbConnected ? 1 : 0);

  const valkeyConnected = await checkValkeyConnection();
  valkeyConnectionGauge.set(valkeyConnected ? 1 : 0);

  return {
    botUptime: botIsUp,
    databaseConnected: dbConnected,
    valkeyConnected: valkeyConnected
  };
}

async function checkBotStatus(): Promise<boolean> {
  const { botToken } = process.env;

  if (!botToken || botToken === 'InsertYourBotTokenHere') {
    console.error('[Live Health] Bot token not configured');
    return false;
  }

  try {
    const bot = new Telegraf(botToken);

    const timeoutPromise = new Promise<boolean>((_, reject) => 
      setTimeout(() => reject(new Error('Bot API timeout')), 3000)
    );

    const botInfoPromise = bot.telegram.getMe().then(() => true);

    const result = await Promise.race([botInfoPromise, timeoutPromise]);
    return result === true;
  } catch (error) {
    console.error('[Live Health] Bot status check failed:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function checkDatabaseConnection(): Promise<boolean> {
  const { databaseUrl } = process.env;

  if (!databaseUrl) {
    console.error('[Live Health] Database URL not configured');
    return false;
  }

  let client: Client | null = null;
  try {
    client = new Client({ connectionString: databaseUrl });

    await Promise.race([
      client.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 3000))
    ]);

    const result = await Promise.race([
      client.query('SELECT 1'),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 2000))
    ]);

    return result.rows.length > 0;
  } catch (error) {
    console.error('[Live Health] Database connection failed:', error instanceof Error ? error.message : String(error));
    return false;
  } finally {
    if (client) {
      try {
        await client.end();
      } catch {}
    }
  }
}

async function checkValkeyConnection(): Promise<boolean> {
  const { valkeyBaseUrl, valkeyPort } = process.env;

  if (!valkeyBaseUrl || !valkeyPort) {
    console.error('[Live Health] Valkey configuration missing');
    return false;
  }

  const valkeyUrl = `redis://${valkeyBaseUrl}:${valkeyPort}`;
  let client: any = null;

  try {
    client = createClient({
      url: valkeyUrl,
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: false as any
      }
    });

    let connectionError = false;

    client.on('error', (err: any) => {
      console.error('[Live Health] Valkey error event:', err.message);
      connectionError = true;
    });

    await Promise.race([
      client.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 2000))
    ]);

    if (connectionError) {
      return false;
    }

    const pong = await Promise.race([
      client.ping(),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Ping timeout')), 1000))
    ]);

    return pong === 'PONG';
  } catch (error) {
    console.error('[Live Health] Valkey connection failed:', error instanceof Error ? error.message : String(error));
    return false;
  } finally {
    if (client) {
      try {
        await client.disconnect();
      } catch {}
    }
  }
}