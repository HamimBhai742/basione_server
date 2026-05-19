import z from "zod";

const createBlogZodSchema = z.object({
  title: z.string({ message: "Title is required" }).min(1, { message: "Title cannot be empty" }),
  content: z.string({ message: "Content is required" }).min(1, { message: "Content cannot be empty" }),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  category: z.string({ message: "Category is required" }).min(1, { message: "Category cannot be empty" }),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional().default("DRAFT"),
});

const updateBlogZodSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export const blogValidation = {
  createBlogZodSchema,
  updateBlogZodSchema,
};
