import z from "zod";

export const loginUserZodSchema = z.object({
  email: z.email({ message: "Email is required" }),
  password: z
    .string({ message: "Password is required" })
    .min(6, { message: "Password must be at least 6 characters" }),
});
