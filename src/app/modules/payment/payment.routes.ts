import { Router } from "express";
import express from "express";
import { paymentController } from "./payment.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.post("/create-payment",checkAuth("user"), paymentController.createPayment);
router.post(
  "/mollie/webhook",
  express.urlencoded({ extended: false }),
  paymentController.mollieWebhook,
);


export const paymentRoutes = router;

