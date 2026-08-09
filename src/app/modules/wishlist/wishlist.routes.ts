import { Router } from "express";
import { wishlistController } from "./wishlist.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.get("/", checkAuth("user"), wishlistController.getWishlist);
router.post("/toggle", checkAuth("user"), wishlistController.toggleWishlist);
router.post("/sync", checkAuth("user"), wishlistController.syncWishlist);

export const wishlistRoutes = router;
