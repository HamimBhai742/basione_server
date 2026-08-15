import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { couponController } from "./coupon.controller";
import { couponValidation } from "./coupon.validation";

const router = Router();

// Public / Customer validation route
router.post(
  "/validate",
  validateRequest(couponValidation.validateCouponZodSchema),
  couponController.validateCoupon
);

// Admin CRUD routes
router.post(
  "/",
  checkAuth("admin"),
  validateRequest(couponValidation.createCouponZodSchema),
  couponController.createCoupon
);

router.get("/", checkAuth("admin"), couponController.getAllCoupons);

router.get("/:id", checkAuth("admin"), couponController.getCouponById);

router.patch(
  "/:id",
  checkAuth("admin"),
  validateRequest(couponValidation.updateCouponZodSchema),
  couponController.updateCoupon
);

router.delete("/:id", checkAuth("admin"), couponController.deleteCoupon);

export const couponRoutes = router;
