import { Router } from "express";
import { orderController } from "./order.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.post("/create-order", checkAuth("user"), orderController.createOrder);

router.post("/checkout", checkAuth("user"), orderController.checkOut);

router.get("/my-orders", checkAuth("user"), orderController.getMyOrders);

router.get("/:id", checkAuth("user"), orderController.getSingleOrder);

export const orderRoutes = router;
