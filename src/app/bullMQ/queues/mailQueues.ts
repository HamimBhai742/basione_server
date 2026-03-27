
import { Queue } from "bullmq";

import { redisOptions } from "../../lib/redis/redisOptions";


export const otpQueueEmail = new Queue("otp-queue-email", { connection: redisOptions });


export const requestQueueEmail = new Queue("request-queue-email", { connection: redisOptions });
/*
// requestPasswordReset
await requestQueueEmail.add("requestPasswordReset", {
    email,
    token,
});

// resetPassword
await requestQueueEmail.add("resetPassword", {
    userId,
});

// verifyParentOtp
await otpQueueEmail.add("verifyParentOtp", {
    email,
    otp,
});

// resendParentOtp
await otpQueueEmail.add("resendParentOtp", {
    email,
});


// requestPasswordReset

// resetPassword

// verifyParentOtp

// resendParentOtp

// updateTwoFactorAuthentication

// loginUser

// resendTwoFactorOTP

*/



