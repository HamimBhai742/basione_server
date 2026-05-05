import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

export const upload = multer({
  storage: multer.memoryStorage(),
  // storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB file
    fieldSize: 100 * 1024 * 1024, // 100MB text field
    fields: 20,
    files: 10,
  },

  fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
    cb(null, true);
  },
});
