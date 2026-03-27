import { Queue } from "bullmq";
import { redisOptions } from "../../lib/redis/redisOptions";

const persistenceQueue = new Queue("messagePersistenceQueue", {
    connection: redisOptions
});



export const messagePersistenceQueue = {
    queue: persistenceQueue
}