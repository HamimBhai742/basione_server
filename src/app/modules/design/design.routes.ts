import { Router } from "express";
import { designController } from "./design.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.get("/my-design", checkAuth("user"), designController.myDesign);

export const designRoutes = router;
