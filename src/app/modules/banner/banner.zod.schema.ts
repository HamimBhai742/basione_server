import { z } from "zod";

export const bannerGenerateSchema = z.object({
  occasion: z
    .string({
      message: "Occasion is required",
    })
    .min(1, "Occasion is required"),

  style: z
    .string({
      message: "Style is required",
    })
    .min(1, "Style is required"),

  headline: z
    .string({
      message: "Headline is required",
    })
    .min(1, "Headline is required"),

  name: z
    .string({
      message: "Name is required",
    })
    .min(1, "Name is required"),

  hobbies: z
    .array(z.string().min(1, "Hobby cannot be empty"))
    .max(3, "You can add up to 3 hobbies")
    .default([]),

  description: z
    .string({
      message: "Description is required",
    })
    .min(1, "Description is required"),

  size: z.object({
    type: z
      .string({
        message: "Size type is required",
      })
      .min(1, "Size type is required"),

    label: z
      .string({
        message: " label is required",
      })
      .min(1, "Size label is required"),

    width: z
      .number({
        message: "Width is required",
      })
      .positive("Width must be greater than 0"),

    height: z
      .number({
        message: "Height is required",
      })
      .positive("Height must be greater than 0"),
  }),
});
