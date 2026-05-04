import express, { Application } from "express";
import { router } from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
// import { stripeWebhook } from "./app/modules/stripe/stripeWebhook";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: Application = express();

// app.post(
//   "/api/v1/webhook",
//   express.raw({ type: "application/json" }),
//   stripeWebhook,
// );

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3000",
  "https://basione-client-8yhdgumhx-tahsins-projects-38f8b810.vercel.app",
  "https://basione-client-sage.vercel.app",
  "https://fortifiable-unpopulous-sonia.ngrok-free.dev",
  "https://basione-client-zvf8yv2t9-tahsins-projects-38f8b810.vercel.app",
  "https://basione-client.vercel.app",
  "http://10.0.70.135:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("ngrok");

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.send("basione server is running............");
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
