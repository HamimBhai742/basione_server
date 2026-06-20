import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { contactSubmitSchema } from "./contact.zod.schema";
import { contactController } from "./contact.controller";

const router = Router();

router.post("/", validateRequest(contactSubmitSchema), contactController.submitContactForm);

export const contactRoutes = router;
