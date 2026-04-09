
import { Queue } from "bullmq";
import { redis } from "../../lib/redis/redisOptions";

// import { redisOptions } from "../../lib/redis/redisOptions";


export const aiChatQueue = new Queue("ai-chat-queue", { connection: redis });


