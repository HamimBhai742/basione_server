import z from "zod";

export const userZodSchema = z.object({
  name: z.string({ message: "Naam is verplicht" }),
  email: z.email({ message: "E-mailadres is verplicht" }),
  password: z
    .string({ message: "Wachtwoord is verplicht" })
    .min(6, { message: "Wachtwoord moet minstens 6 tekens bevatten" }),
});

export const otpVerifyZodSchema = z.object({
  otp: z
    .string({ message: "OTP is verplicht" })
    .length(6, { message: "OTP moet 6 cijfers zijn" }),
  email: z.email({ message: "E-mailadres is verplicht" }),
});

export const otpResendZodSchema = z.object({
  email: z.email({ message: "E-mailadres is verplicht" }),
});

export const userUpdateZodSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
});

export const forgotPasswordZodSchema = z.object({
  email: z.email({ message: "E-mailadres is verplicht" }),
});

export const resetPasswordZodSchema = z.object({
  token: z.string({ message: "Token is verplicht" }),
  password: z
    .string({ message: "Wachtwoord is verplicht" })
    .min(6, { message: "Wachtwoord moet minstens 6 tekens bevatten" })
});

export const fcmTokenZodSchema = z.object({
  fcmToken: z.string({ message: "FCM token is verplicht" }).min(1, { message: "FCM token mag niet leeg zijn" }),
});

