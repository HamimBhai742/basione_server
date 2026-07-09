import { Router } from "express";
import { cartController } from "./cart.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.get("/", checkAuth("user"), cartController.getCart);
router.post("/add", checkAuth("user"), cartController.addToCart);
router.put("/update/:id", checkAuth("user"), cartController.updateCartItem);
router.delete("/remove/:id", checkAuth("user"), cartController.removeFromCart);
router.post("/sync", checkAuth("user"), cartController.syncCart);

export const cartRoutes = router;
