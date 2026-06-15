const redis = require('redis');

let client = null;

async function getRedisClient() {
  if (client && client.isOpen) {
    return client;
  }

  client = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
  });

  await client.connect();
  return client;
}

async function closeRedis() {
  if (client && client.isOpen) {
    await client.quit();
    client = null;
  }
}

module.exports = { getRedisClient, closeRedis };
