import express, { Application } from "express";
import { router } from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { stripeWebhook } from "./app/modules/stripe/stripeWebhook";
const app: Application = express();

app.post(
  "/api/v1/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.send("basione server is running............");
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
