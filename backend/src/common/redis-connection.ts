export function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      const normalised = redisUrl.startsWith('redis')
        ? redisUrl
        : `redis://${redisUrl}`;
      const url = new URL(normalised);
      return {
        host: url.hostname,
        port: parseInt(url.port || '6379'),
        ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
        ...(url.username && url.username !== 'default'
          ? { username: url.username }
          : {}),
        ...(normalised.startsWith('rediss://') ? { tls: {} } : {}),
        maxRetriesPerRequest: null as null,
      };
    } catch {
      const [host, port] = redisUrl.split(':');
      return {
        host,
        port: parseInt(port || '6379'),
        maxRetriesPerRequest: null as null,
      };
    }
  }

  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null as null,
  };
}
