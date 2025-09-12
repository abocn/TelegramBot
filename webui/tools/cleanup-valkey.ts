import Redis from 'ioredis';

const createValkeyClient = () => {
  const vkBase = process.env.valkeyBaseUrl;
  const vkPort = Number(process.env.valkeyPort);

  if (!vkBase || !vkPort) {
    throw new Error('Valkey envs are not set!');
  }

  const client = new Redis({
    host: vkBase,
    port: vkPort,
    connectTimeout: 5000,
    lazyConnect: true,
  });

  client.on('error', () => {});
  return client;
};

export async function cleanupExpiredValkeyEntries(valkeyClient: Redis): Promise<number> {
  let totalRemoved = 0;
  let cursor = '0';
  const now = Date.now();
  const defaultWindowMs = 60 * 60 * 1000; //1h
  const windowStart = now - defaultWindowMs;

  do {
    const [nextCursor, keys] = await valkeyClient.scan(
      cursor,
      'MATCH',
      'ratelimit:*',
      'COUNT',
      100
    );

    cursor = nextCursor;

    if (keys.length > 0) {
      const pipeline = valkeyClient.pipeline();

      for (const key of keys) {
        pipeline.zremrangebyscore(key, 0, windowStart);
        pipeline.zcard(key);
      }

      const results = await pipeline.exec();

      if (results) {
        const keysToDelete: string[] = [];
        for (let i = 0; i < keys.length; i++) {
          const zcardIndex = i * 2 + 1;
          const remainingCount = (results[zcardIndex][1] as number) || 0;
          if (remainingCount === 0) {
            keysToDelete.push(keys[i]);
          }
        }

        if (keysToDelete.length > 0) {
          const deletedCount = await valkeyClient.del(...keysToDelete);
          totalRemoved += deletedCount;
        }
      }
    }
  } while (cursor !== '0');

  return totalRemoved;
}

export async function runValkeyCleanup() {
  let valkeyClient: Redis | null = null;

  try {
    if (process.env.longerLogs) { console.log('[VK CLEAN] Running...'); }

    valkeyClient = createValkeyClient();

    await valkeyClient.ping();

    const removedCount = await cleanupExpiredValkeyEntries(valkeyClient);
    if (removedCount >= 0) { console.log(`[VK CLEAN] Removed ${removedCount} expired entries`); }
  } catch (error) {
    console.log('[! VK CLEAN] Cleanup skipped - Valkey not available:\n', error);
  } finally {
    if (valkeyClient) {
      await valkeyClient.disconnect();
    }
    process.exit(0);
  }
}

if (import.meta.main) {
  runValkeyCleanup();
}