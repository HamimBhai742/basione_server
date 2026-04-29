import { z } from "zod";

export const bannerGenerateSchema = z.object({
  style: z.string().min(1),
  image: z.instanceof(File).optional(),
  size: z.any(),

  customWidth: z.string().optional(),
  customHeight: z.string().optional(),

  name: z.string().min(1),

  age: z.string().optional(), // ✅ NEW
  occasion: z.string().min(1, "Please select occasion"), // ✅ NEW

  headline: z.string().optional(), // ✅ NEW
  subheadline: z.string().optional(), // ✅ NEW

  hobbies : z.array(z.string()).optional(),
  description: z.string().min(10),
});
