import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { shippingController } from "./shipping.controller";
import {
  createShipmentSchema,
  registerWebhookSchema,
} from "./shipping.zod.schema";

const router = Router();

router.get(
  "/methods",
 // checkAuth("user", "admin"),
  shippingController.getShippingMethods,
);

router.get(
  "/setup/companies",
  // checkAuth("admin"),
  shippingController.getSetupCompanies,
);

router.get(
  "/setup/companies/:companyId/brands",
  // checkAuth("admin"),
  shippingController.getSetupBrands,
);

router.get(
  "/setup/companies/:companyId/products",
  // checkAuth("admin"),
  shippingController.getSetupProducts,
);

router.get(
  "/setup/companies/:companyId/product-combinations",
  // checkAuth("admin"),
  shippingController.getSetupProductCombinations,
);

router.post(
  "/shipments",
  checkAuth("admin","user"),
  validateRequest(createShipmentSchema),
  shippingController.createShipment,
);

router.get(
  "/orders/:orderId/shipments",
  checkAuth("user", "admin"),
  shippingController.getOrderShipment,
);

router.post(
  "/orders/:orderId/shipments/refresh",
  checkAuth("user", "admin"),
  shippingController.refreshShipment,
);

router.get(
  "/shipments/:shipmentId/label",
  checkAuth("user", "admin"),
  shippingController.downloadLabel,
);

router.get(
  "/webhook-types",
  checkAuth("admin"),
  shippingController.getWebhookTypes,
);

router.post(
  "/webhooks/register",
  checkAuth("admin"),
  validateRequest(registerWebhookSchema),
  shippingController.registerWebhook,
);

router.post("/webhooks/qls", shippingController.handleWebhook);

export const shippingRoutes = router;
