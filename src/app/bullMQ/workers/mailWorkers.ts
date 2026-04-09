// import { redisOptions } from "../../lib/redis/redisOptions";
import { Worker } from "bullmq";
import { registrationOtpTemplate } from "../../utils/emailTemplates/registrationOtpTemplate";
import { passwordChangedTemplate } from "../../utils/emailTemplates/passwordChangedTemplate";
import { forgotPasswordOTPTemplate } from "../../utils/emailTemplates/forgotPasswordOTPTemplate";
import { resetPasswordSuccessTemplate } from "../../utils/emailTemplates/resetPasswordSuccessTemplate";
import { orderConfirmationTemplate } from "../../utils/emailTemplates/orderConfirmationTemplate";
import { paymentSuccessTemplate } from "../../utils/emailTemplates/paymentSuccess";
import { paymentCancelledTemplate } from "../../utils/emailTemplates/paymentCanceled";
import { redis } from "../../lib/redis/redisOptions";

export const otpEmailWorker = new Worker(
  "otp-queue-email",
  async (job) => {
    switch (job.name) {
      // handle verify
      case "registrationOtp": {
        const { userName, email, otpCode } = job.data;
        await registrationOtpTemplate({
          userName,
          email,
          otp: otpCode,
          requestedAt: new Date().toLocaleString(),
        });
        return "Otp end job completed";
      }
      case "passwordChangedConfirmation": {
        const { userName, email, subject, secureLink } = job.data;
        await passwordChangedTemplate(userName, subject, email, secureLink);
        return "Otp end job completed";
      }
      case "forgotPasswordOTP": {
        const { userName, email, otpCode } = job.data;
        await forgotPasswordOTPTemplate({
          userName,
          email,
          otp: otpCode,
          requestedAt: new Date().toLocaleString(),
        });
        return "Otp end job completed";
      }
      case "resetPasswordSuccess": {
        const { userName, email } = job.data;
        await resetPasswordSuccessTemplate({
          userName,
          email,
          resetAt: new Date().toLocaleString(),
        });
        return "Otp end job completed";
      }
      case "orderConfirmation": {
        const { userName, email, subject, data } = job.data;
        await orderConfirmationTemplate(userName, subject, email, data);
        return "Otp end job completed";
      }
      case "paymentSuccessTemplate": {
        const { data } = job.data;
        await paymentSuccessTemplate(data);
        return "Otp end job completed";
      }
      case "paymentCancelledTemplate": {
        const { data } = job.data;
        await paymentCancelledTemplate(data);
        return "Otp end job completed";
      }

      case "resendParentOtp":
        // handle resend
        break;
    }
  },
  { connection: redis, concurrency: 5 },
);

otpEmailWorker.on("failed", (job, err) => {
  console.log(`❌ OTP job failed: ${job?.id}`, err);
});

otpEmailWorker.on("completed", (job) => {
  console.log(`✅ OTP job completed: ${job.id}`);
});
