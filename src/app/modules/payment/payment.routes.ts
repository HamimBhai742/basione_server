import { Router } from "express";
import express from "express";
import { paymentController } from "./payment.controller";
import { checkAuth, optionalAuth } from "../../middleware/checkAuth";

const router = Router();

router.post("/create-payment",checkAuth("user"), paymentController.createPayment);
router.get(
  "/status/:paymentId",
  optionalAuth("user", "admin"),
  paymentController.syncPaymentStatus,
);
router.post(
  "/mollie/webhook",
  express.urlencoded({ extended: false }),
  paymentController.mollieWebhook,
);


export const paymentRoutes = router;

