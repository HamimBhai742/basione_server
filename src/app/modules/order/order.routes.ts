import { Router } from "express";
import { orderController } from "./order.controller";
import { checkAuth, optionalAuth } from "../../middleware/checkAuth";

const router = Router();

router.post("/create-order", optionalAuth("user"), orderController.createOrder);

router.post("/checkout", optionalAuth("user"), orderController.checkOut);


router.get("/my-orders", checkAuth("user"), orderController.getMyOrders);

router.get("/my-designs", checkAuth("user"), orderController.getMyDesigns);

router.get("/guest/:id", orderController.getGuestOrder);

router.get("/track", orderController.trackOrder);

router.get("/:id", checkAuth("user", "admin"), orderController.getSingleOrder);

router.patch("/cancel/:id", checkAuth("user"), orderController.cancledOrder);

export const orderRoutes = router;
