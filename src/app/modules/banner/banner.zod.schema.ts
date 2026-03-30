import z from "zod";

export const createBannerZodSchema = z.object({
  style: z.enum(
    [
      "minimal",
      "abstract",
      "realistic",
      "polaroid art",
      "sunset",
      "water color",
      "flat design",
    ],
    {
      message:
        "Style must be one of: minimal, abstract, realistic, polaroid art, sunset, water color, flat design",
    },
  ),
  height: z
    .number({ message: "Height is required" })
    .max(160, { message: "Height must be less than or equal to 160 cm" }),
  width: z.number({ message: "Width is required" }).max(240, {
    message: "Width must be less than or equal to 240 cm",
  }),
  name: z.string({ message: "Name is required" }),
  describe: z.string({ message: "Describe is required" }),
  category: z.enum(
    ["wedding", "birthday", "kids_party", "baby_shower", "engagement"],
    {
      message:
        "Category must be one of: wedding, birthday, kids_party, baby_shower, engagement",
    },
  ),
});
