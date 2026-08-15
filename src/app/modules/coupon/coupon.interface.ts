export type DiscountType = "percentage" | "fixed";

export interface ICreateCouponPayload {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  usageLimit?: number;
  isActive?: boolean;
  description?: string;
}

export interface IUpdateCouponPayload {
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  usageLimit?: number | null;
  isActive?: boolean;
  description?: string | null;
}

export interface IValidateCouponPayload {
  code: string;
  subtotal: number; // Product subtotal including VAT
}

export interface IValidateCouponResponse {
  isValid: boolean;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number; // Calculated discount amount for products only
  originalSubtotal: number;
  discountedSubtotal: number;
  message?: string;
}
