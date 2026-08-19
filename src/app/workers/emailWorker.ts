import { Worker, Job } from "bullmq";
import redisConnection from "../lib/redis/redis";
import config from "../../config";
import { registrationOtpTemplate } from "../utils/emailTemplates/registrationOtpTemplate";
import { registrationSuccessTemplate } from "../utils/emailTemplates/registrationSuccess";
import { forgotPasswordOTPTemplate } from "../utils/emailTemplates/forgotPasswordOTPTemplate";
import { resetPasswordSuccessTemplate } from "../utils/emailTemplates/resetPasswordSuccessTemplate";

export const emailWorker = config.redis.useRedis
  ? new Worker(
      "email-queue",
      async (job: Job) => {
        switch (job.name) {
          case "registrationOtp":
            await registrationOtpTemplate(job.data);
            break;
          case "registrationSuccess":
            await registrationSuccessTemplate(job.data);
            break;
          case "forgotPasswordOTP":
            await forgotPasswordOTPTemplate(job.data);
            break;
          case "resetPasswordSuccess":
            await resetPasswordSuccessTemplate(job.data);
            break;
          default:
            console.warn(`[EmailWorker] Unknown job name: ${job.name}`);
        }
      },
      {
        connection: redisConnection,
        concurrency: 5,
      }
    )
  : null;

if (emailWorker) {
  emailWorker.on("failed", (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} failed:`, err);
  });
}
