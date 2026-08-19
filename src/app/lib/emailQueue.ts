import { Queue } from "bullmq";
import redisConnection from "./redis/redis";
import config from "../../config";
import { registrationOtpTemplate } from "../utils/emailTemplates/registrationOtpTemplate";
import { registrationSuccessTemplate } from "../utils/emailTemplates/registrationSuccess";
import { forgotPasswordOTPTemplate } from "../utils/emailTemplates/forgotPasswordOTPTemplate";
import { resetPasswordSuccessTemplate } from "../utils/emailTemplates/resetPasswordSuccessTemplate";

export const emailQueue = config.redis.useRedis
  ? new Queue("email-queue", {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: { type: "fixed", delay: 5000 },
      },
    })
  : null;

export const addEmailJob = async (jobName: string, data: any) => {
  // Check if Redis is disabled, offline, or not ready
  if (
    !config.redis.useRedis ||
    !emailQueue ||
    !redisConnection ||
    redisConnection.status !== "ready"
  ) {
    // console.log(`[EmailQueue] Redis is offline (${redisConnection.status}). Sending synchronously...`);
    try {
      switch (jobName) {
        case "registrationOtp":
          await registrationOtpTemplate(data);
          break;
        case "registrationSuccess":
          await registrationSuccessTemplate(data);
          break;
        case "forgotPasswordOTP":
          await forgotPasswordOTPTemplate(data);
          break;
        case "resetPasswordSuccess":
          await resetPasswordSuccessTemplate(data);
          break;
        default:
          console.warn(`[EmailQueue] Unknown template for sync fallback: ${jobName}`);
      }
    } catch (err) {
      console.error(`[EmailQueue] Sync fallback email sending failed for ${jobName}:`, err);
    }
    return;
  }

  // Otherwise add to queue
  try {
    await emailQueue.add(jobName, data);
  } catch (err) {
    console.error(`[EmailQueue] Failed to add job to queue, falling back to sync:`, err);
    try {
      if (jobName === "registrationOtp") await registrationOtpTemplate(data);
      else if (jobName === "registrationSuccess") await registrationSuccessTemplate(data);
      else if (jobName === "forgotPasswordOTP") await forgotPasswordOTPTemplate(data);
      else if (jobName === "resetPasswordSuccess") await resetPasswordSuccessTemplate(data);
    } catch (syncErr) {
      console.error(`[EmailQueue] Last resort sync email failed:`, syncErr);
    }
  }
};
