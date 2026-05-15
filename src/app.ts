import express, { Application } from "express";
import { router } from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { AppError } from "./app/error/AppError";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3000",
  "https://spandoekprint.nl",
  "https://www.spandoekprint.nl",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("ngrok");
      origin.includes(".nl");

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
