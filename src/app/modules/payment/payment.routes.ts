import { Router } from "express";
import express from "express";
import { paymentController } from "./payment.controller";

const router = Router();

router.post("/create-payment", paymentController.createPayment);
router.post(
  "/mollie/webhook",
  express.urlencoded({ extended: false }),
  paymentController.mollieWebhook,
);


export const paymentRoutes = router;

