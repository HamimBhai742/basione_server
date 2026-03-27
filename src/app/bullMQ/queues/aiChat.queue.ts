
import { Queue } from "bullmq";

import { redisOptions } from "../../lib/redis/redisOptions";


export const aiChatQueue = new Queue("ai-chat-queue", { connection: redisOptions });


