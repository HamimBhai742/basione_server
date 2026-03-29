import z from "zod";

export const userZodSchema = z.object({
  name: z.string({ message: "Name is required" }),
  email: z.email({ message: "Email is required" }),
  password: z
    .string({ message: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters" }),
});

export const otpVerifyZodSchema = z.object({
  otp: z
    .string({ message: "OTP is required" })
    .length(6, { message: "OTP must be 6 digits" }),
  email: z.email({ message: "Email is required" }),
});

export const otpResendZodSchema = z.object({
  email: z.email({ message: "Email is required" }),
});

export const userUpdateZodSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  image: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
});

export const forgotPasswordZodSchema = z.object({
  email: z.email({ message: "Email is required" }),
});

export const resetPasswordZodSchema = z.object({
  token: z.string({ message: "Token is required" }),
  password: z
    .string({ message: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters" })
});
