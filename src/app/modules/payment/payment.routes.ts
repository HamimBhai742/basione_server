import { Router } from "express";
import { paymentController } from "./payment.controller";

const router = Router();

router.get("/success", paymentController.successPayment);

router.get("/cancel", paymentController.cancelPayment);

export const paymentRoutes = router;
