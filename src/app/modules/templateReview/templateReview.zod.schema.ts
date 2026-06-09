import z from "zod";

const createTemplateReviewZodSchema = z.object({
  orderId: z.string({ message: "orderId is required" }).min(1),
  rating: z.coerce
    .number({ message: "rating is required" })
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot be more than 5"),
  comment: z
    .string()
    .trim()
    .max(1000, "Comment cannot be more than 1000 characters")
    .optional(),
});

export const templateReviewValidation = {
  createTemplateReviewZodSchema,
};
