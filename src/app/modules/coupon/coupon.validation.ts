import z from "zod";

const createCouponZodSchema = z.object({
  code: z
    .string({ message: "Kortingscode is verplicht." })
    .min(2, { message: "Code moet minstens 2 tekens lang zijn." })
    .max(50, { message: "Code mag maximaal 50 tekens lang zijn." }),
  discountType: z.enum(["percentage", "fixed"], {
    message: "Type korting is verplicht (percentage of fixed).",
  }),
  discountValue: z
    .number({ message: "Kortingswaarde is verplicht." })
    .positive({ message: "Kortingswaarde moet groter zijn dan 0." }),
  minOrderAmount: z.number().min(0).optional().default(0),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  description: z.string().max(255).optional().nullable(),
});

const updateCouponZodSchema = z.object({
  code: z.string().min(2).max(50).optional(),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().positive().optional(),
  minOrderAmount: z.number().min(0).optional().nullable(),
  maxDiscountAmount: z.number().positive().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  description: z.string().max(255).optional().nullable(),
});

const validateCouponZodSchema = z.object({
  code: z.string({ message: "Kortingscode is verplicht." }).min(1),
  subtotal: z.number({ message: "Subtotaal is verplicht." }).min(0),
});

export const couponValidation = {
  createCouponZodSchema,
  updateCouponZodSchema,
  validateCouponZodSchema,
};
