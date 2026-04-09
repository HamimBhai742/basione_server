import { Queue } from "bullmq";
import { redis } from "../../lib/redis/redisOptions";

// import { redisOptions } from "../../lib/redis/redisOptions";


export const assignJobQueue = new Queue("assign-job-queue", { connection: redis });
