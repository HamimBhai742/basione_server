import { Router } from "express";
import { paymentController } from "./payment.controller";

const router = Router();

router.get("/success", paymentController.successPayment);

export const paymentRoutes = router;
