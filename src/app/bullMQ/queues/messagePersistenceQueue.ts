import { Queue } from "bullmq";
import { redis } from "../../lib/redis/redisOptions";

const persistenceQueue = new Queue("messagePersistenceQueue", {
    connection: redis
});



export const messagePersistenceQueue = {
    queue: persistenceQueue
}