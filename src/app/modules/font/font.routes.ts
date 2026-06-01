import { Router } from "express";
import { fontController } from "./font.controller";

const router = Router();

router.get("/", fontController.getPublicFonts);

export const fontRoutes = router;
