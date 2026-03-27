import redisConnect from "../lib/redis/redis";
import { conversationListQueue } from "./queues/conversationListQueue";
import { otpQueueEmail } from "./queues/mailQueues";
import { otpEmailWorker } from "./workers/mailWorkers";

process.on("SIGINT", async () => {
  console.log("🚨 Gracefully shutting down...");

  await otpEmailWorker.close();
  await conversationListQueue.close();
  console.log("✅ Workers and Queues closed gracefully ");
  process.exit(0);
});

console.log("Workers running...");

export { redisConnect, otpEmailWorker, conversationListQueue, otpQueueEmail };
