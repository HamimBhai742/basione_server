import { Queue } from "bullmq";

import { redisOptions } from "../../lib/redis/redisOptions";


export const conversationListQueue = new Queue("conversationList", {
    connection: redisOptions
});