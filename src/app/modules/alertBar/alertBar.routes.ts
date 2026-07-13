import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { alertBarController } from "./alertBar.controller";

const router = Router();

router.get("/", alertBarController.getAlertBarSetting);
router.patch("/", checkAuth("admin"), alertBarController.updateAlertBarSetting);

export const alertBarRoutes = router;
