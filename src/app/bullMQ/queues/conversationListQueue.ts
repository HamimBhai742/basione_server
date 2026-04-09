import { Queue } from "bullmq";
import { redis } from "../../lib/redis/redisOptions";

// import { redisOptions } from "../../lib/redis/redisOptions";


export const conversationListQueue = new Queue("conversationList", {
    connection: redis
});