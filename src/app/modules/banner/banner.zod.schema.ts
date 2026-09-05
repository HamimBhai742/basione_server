import { z } from "zod";

const dummyRegex = /(\bproducttitel\b|lorem\s+ipsum|\blorem\b|sit\s+inventore)/i;
const noDummy = (val?: string) => !val || !dummyRegex.test(val);

export const bannerGenerateSchema = z.object({
  style: z.string().min(1),
  image: z.instanceof(File).optional(),
  size: z.any(),

  customWidth: z.string().optional(),
  customHeight: z.string().optional(),

  name: z.string().min(1).refine(noDummy, {
    message: "Naam mag geen placeholder of dummy tekst bevatten",
  }),

  age: z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined), // ✅ NEW
  occasion: z.string().min(1, "Selecteer een gelegenheid"), // ✅ NEW

  headline: z.string().optional().refine(noDummy, {
    message: "Titel mag geen placeholder of dummy tekst bevatten",
  }), // ✅ NEW
  subheadline: z.string().optional().refine(noDummy, {
    message: "Subtitel mag geen placeholder of dummy tekst bevatten",
  }), // ✅ NEW

  hobbies: z.array(z.string()).optional(),
  description: z.string().min(10).refine(noDummy, {
    message: "Beschrijving mag geen dummy of 'lorem ipsum' tekst bevatten",
  }),
});
