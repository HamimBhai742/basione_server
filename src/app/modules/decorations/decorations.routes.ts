import { Router } from "express";
import { decorationController } from "./decorations.controller";

const router = Router();

router.get("/", decorationController.getAllDecoration);

export const decorationRoutes = router;
