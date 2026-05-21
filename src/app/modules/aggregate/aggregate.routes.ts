import { Router } from "express";
import { aggregateController } from "./aggregate.controller";

const router = Router();

router.get("/", aggregateController.getAggregateData);

export const aggregateRoutes = router;
