import { Router } from "express";
import { designController } from "./design.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.post("/create-design", checkAuth("user"), designController.createDesign);

router.get("/my-design", checkAuth("user"), designController.myDesign);

router.get("/all-designs", designController.getAllDesigns);

export const designRoutes = router;
