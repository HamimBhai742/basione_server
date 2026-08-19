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
import config from "../../../config";

const globalForRedis = global as unknown as {
  redis: Redis | undefined;
};

export const redis =
  !config.redis.useRedis
    ? (null as unknown as Redis)
    : (globalForRedis.redis ??
      new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: null,
        connectTimeout: 10000,
        retryStrategy: (times: number) => {
          const host = config.redis.host;
          const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
          if (isLocal && times > 3) {
            return null; // Stop retrying for local Redis to avoid console flooding
          }
          return Math.min(times * 1000, 5000);
        },
      }));

if (config.redis.useRedis && process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
