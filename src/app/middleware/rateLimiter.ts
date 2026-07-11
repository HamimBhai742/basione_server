import rateLimit from "express-rate-limit";

/**
 * Strict limiter for login/register — 10 attempts per 15 minutes per IP.
 * Prevents brute-force attacks on auth endpoints.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Te veel pogingen. Probeer het over 15 minuten opnieuw.",
  },
});

/**
 * OTP limiter — 5 OTP requests per 10 minutes per IP.
 * Prevents OTP spam/enumeration attacks.
 */
export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Te veel OTP-verzoeken. Probeer het over 10 minuten opnieuw.",
  },
});

/**
 * General API limiter — 200 requests per minute per IP.
 * Prevents general API abuse.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Te veel verzoeken. Probeer het even later opnieuw.",
  },
});
