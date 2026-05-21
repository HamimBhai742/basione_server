import z from "zod";

export const loginUserZodSchema = z.object({
  email: z.email({ message: "E-mailadres is verplicht" }),
  password: z
    .string({ message: "Wachtwoord is verplicht" })
    .min(6, { message: "Wachtwoord moet minstens 6 tekens bevatten" }),
});
