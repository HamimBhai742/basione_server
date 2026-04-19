import { Router } from "express";
import { orderController } from "./order.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.post("/create-order", checkAuth("user"), orderController.createOrder);

router.post("/checkout", checkAuth("user"), orderController.checkOut);

router.get("/my-orders", checkAuth("user"), orderController.getMyOrders);

router.get("/my-designs", checkAuth("user"), orderController.getMyDesigns);

router.get("/:id", checkAuth("user"), orderController.getSingleOrder);

router.patch("/cancel/:id", checkAuth("user"), orderController.cancledOrder);

router.post("/confirm/:id", checkAuth("admin"), orderController.orderConfirmationByAdmin);



export const orderRoutes = router;
