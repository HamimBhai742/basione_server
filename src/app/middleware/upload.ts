import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

export const upload = multer({
  storage: multer.memoryStorage(),
  // storage,
  limits: {
    // fileSize: 250 * 1024 * 1024, // ২৫০MB = 250 * 1024 * 1024 bytes
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },

  fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    cb(null, true);
  },
});
