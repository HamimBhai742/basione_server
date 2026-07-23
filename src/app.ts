import express, { Application } from "express";
import { router } from "./app/routes";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { AppError } from "./app/error/AppError";
import { chatbotRoutes } from "./app/modules/chatbot/chatbot.routes";

const app: Application = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
        (process.env.NODE_ENV !== "production" &&
          (origin.includes(".ngrok-free.dev") ||
            origin.startsWith("http://10.") ||
            origin.startsWith("http://192.168.")));

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new AppError("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);
app.use(cookieParser());

app.use("/api/v1", router);

app.use("/api/chatbot", chatbotRoutes);

app.get("/", (req, res) => {
  res.send("basione server is running............");
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
