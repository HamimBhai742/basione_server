import { Router } from "express";
import { webwinkelkeurController } from "./webwinkelkeur.controller";

const router = Router();

router.get("/reviews", webwinkelkeurController.getReviews);

export const webwinkelkeurRoutes = router;
