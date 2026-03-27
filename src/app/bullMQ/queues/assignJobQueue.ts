import { Queue } from "bullmq";

import { redisOptions } from "../../lib/redis/redisOptions";


export const assignJobQueue = new Queue("assign-job-queue", { connection: redisOptions });
