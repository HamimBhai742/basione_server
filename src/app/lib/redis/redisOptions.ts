// import Redis, { RedisOptions } from "ioredis";


// export const redisOptions: RedisOptions = {
//     host: process.env.REDIS_HOST || "127.0.0.1",
//     port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
//     password: process.env.REDIS_PASSWORD,
//     retryStrategy: (times: number) => {
//         if (times > 5) return undefined;
//         return Math.min(times * 100, 3000);
//     },
//     connectTimeout: 10000,
//     keepAlive: 30000,
//     maxRetriesPerRequest: null,
// };

// export const redis = new Redis(redisOptions);


import Redis from "ioredis";

const globalForRedis = global as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
      ? parseInt(process.env.REDIS_PORT, 10)
      : 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    connectTimeout: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
