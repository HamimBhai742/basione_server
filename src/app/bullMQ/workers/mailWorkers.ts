import { redisOptions } from "../../lib/redis/redisOptions";
import { Worker } from "bullmq";

import { emailTemplate } from "../../utils/emailTemplates/forgetPasswordOtpTemplate";
import { twoFactorOtpTemplate } from "../../utils/emailTemplates/twoFactorOtpTemplate";
import { registrationOtpTemplate } from "../../utils/emailTemplates/registrationOtpTemplate";
import { passwordChangedTemplate } from "../../utils/emailTemplates/passwordChangedTemplate";
import { passwordResetTemplate } from "../../utils/emailTemplates/passwordResetTemplate";
import { parentApprovalOtpTemplate } from "../../utils/emailTemplates/parentApprovalOtpTemplate";
import { resetPasswordSuccessTemplate } from "../../utils/emailTemplates/resetOtpSuccess";
import { orderConfirmationTemplate } from "../../utils/emailTemplates/orderConfirmationTemplate";

export const otpEmailWorker = new Worker(
  "otp-queue-email",
  async (job) => {
    switch (job.name) {
      case "verifyParentOtp": {
        const { userName, email, otpCode, subject } = job.data;
        await emailTemplate.forgetPasswordOtpTemplate(
          userName,
          subject,
          email,
          otpCode,
        );
        return "Otp end job completed";
      }
      // handle verify
      case "registrationOtp": {
        const { userName, email, otpCode, subject } = job.data;
        await registrationOtpTemplate(userName, subject, email, otpCode);
        return "Otp end job completed";
      }
      case "twoFactorOtp": {
        const { userName, email, otpCode, subject } = job.data;
        await twoFactorOtpTemplate(userName, subject, email, otpCode);
        return "Otp end job completed";
      }
      case "passwordChangedConfirmation": {
        const { userName, email, subject, secureLink } = job.data;
        await passwordChangedTemplate(userName, subject, email, secureLink);
        return "Otp end job completed";
      }
      case "passwordResetRequest": {
        const { userName, email, subject, otpCode } = job.data;
        await passwordResetTemplate(userName, subject, email, otpCode);
        return "Otp end job completed";
      }
      case "resetPasswordSuccess": {
        const { userName, email } = job.data;
        await resetPasswordSuccessTemplate(userName, email);
        return "Otp end job completed";
      }
      case "parentApprovalOtp": {
        const { userName, email, subject, otpCode } = job.data;
        await parentApprovalOtpTemplate(userName, subject, email, otpCode);
        return "Otp end job completed";
      }
      case "orderConfirmation": {
        const { userName, email, subject, data } = job.data;
        await orderConfirmationTemplate(userName, subject, email, data);
        return "Otp end job completed";
      }

      case "resendParentOtp":
        // handle resend
        break;
    }
  },
  { connection: redisOptions },
);

otpEmailWorker.on("failed", (job, err) => {
  console.log(`❌ OTP job failed: ${job?.id}`, err);
});

otpEmailWorker.on("completed", (job) => {
  console.log(`✅ OTP job completed: ${job.id}`);
});
