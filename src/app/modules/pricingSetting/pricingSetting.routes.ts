import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { pricingSettingController } from "./pricingSetting.controller";

const router = Router();

router.get("/", pricingSettingController.getPricingSetting);
router.patch("/", checkAuth("admin"), pricingSettingController.updatePricingSetting);

export const pricingSettingRoutes = router;
