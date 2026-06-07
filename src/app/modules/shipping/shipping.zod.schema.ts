import { z } from "zod";

export const createShipmentSchema = z.object({
  orderId: z.string().min(1),
  carrier: z.enum(["dhl", "dragonfly", "dpd", "postnl"]).optional(),
  productCombinationId: z.number().int().positive().optional(),
  brandId: z.string().min(1).optional(),
  weight: z.number().int().positive().optional(),
  servicepointCode: z.string().min(1).optional(),
  customsInvoiceNumber: z.string().min(1).optional(),
  customsShipmentType: z
    .enum(["commercial", "documents", "return", "sample"])
    .optional(),
  shipmentProducts: z
    .array(
      z.object({
        amount: z.number().int().positive(),
        name: z.string().min(1),
        country_code_of_origin: z.string().min(2).max(2).optional(),
        hs_code: z.string().optional(),
        price_per_unit: z.number().nonnegative().optional(),
        weight_per_unit: z.number().nonnegative().optional(),
        ean: z.string().optional(),
        sku: z.string().optional(),
        currency: z.string().optional(),
      }),
    )
    .optional(),
});

export const registerWebhookSchema = z.object({
  url: z.string().url(),
  typeId: z.number().int().positive(),
});
