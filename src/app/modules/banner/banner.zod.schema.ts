import { z } from "zod";

export const bannerGenerateSchema = z.object({
  style: z.string().min(1),
  image: z.instanceof(File).optional(),
  size: z.any(),

  customWidth: z.string().optional(),
  customHeight: z.string().optional(),

  name: z.string().min(1),

  age: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined), // ✅ NEW
  occasion: z.string().min(1, "Selecteer een gelegenheid"), // ✅ NEW

  headline: z.string().optional(), // ✅ NEW
  subheadline: z.string().optional(), // ✅ NEW

  hobbies: z.array(z.string()).optional(),
  description: z.string().min(10),
});
