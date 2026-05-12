import express, { Application } from "express";
import { router } from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import cors from "cors";
import cookieParser from "cookie-parser";
import { AppError } from "./app/error/AppError";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3001",
  "http://localhost:3000",
  "http://187.127.83.15:3000",
  "https://basione-client-8yhdgumhx-tahsins-projects-38f8b810.vercel.app",
  "https://basione-client-sage.vercel.app",
  "https://fortifiable-unpopulous-sonia.ngrok-free.dev",
  "https://basione-client-zvf8yv2t9-tahsins-projects-38f8b810.vercel.app",
  "https://basione-client.vercel.app",
  "http://10.0.70.135:3000",
  "https://spandoekprint.nl",
  "https://www.spandoekprint.nl"
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
        callback(new AppError("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.send("basione server is running............");
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
