import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { svgMaskService } from "./svgMask.service";
import { sanitizeSvg } from "../../utils/svgSanitizer";
import { uploadFileToS3 } from "../../utils/uploadAws";
import { AppError } from "../../error/AppError";

const uploadSvgMask = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError("Geen bestand geüpload. Upload a.u.b. een SVG-bestand.", 400);
  }

  // 1. Read SVG file content
  const rawSvgContent = req.file.buffer.toString("utf-8");

  // 2. Sanitize SVG to strip scripts/XSS
  const sanitizedSvgContent = sanitizeSvg(rawSvgContent);

  // 3. Update the file buffer and mime type to use with the standard S3 upload helper
  req.file.buffer = Buffer.from(sanitizedSvgContent, "utf-8");
  req.file.mimetype = "image/svg+xml";

  // 4. Upload to S3
  const svgUrl = await uploadFileToS3(req.file, "svg-masks");

  // 5. Create database record
  const name = req.body.name || req.file.originalname.replace(/\.[^/.]+$/, "");
  const result = await svgMaskService.createSvgMask(name, svgUrl);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "SVG Masker succesvol geüpload en gesaneerd",
    data: result,
  });
});

const getAllSvgMasks = catchAsync(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const result = await svgMaskService.getAllSvgMasks(page, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SVG Maskers succesvol opgehaald",
    data: result.masks,
    metaData: result.metaData,
  });
});

const bindMaskToTemplate = catchAsync(async (req: Request, res: Response) => {
  const { templateId, svgMaskId } = req.body;
  const result = await svgMaskService.bindMaskToTemplate(templateId, svgMaskId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SVG Masker succesvol gekoppeld aan template",
    data: result,
  });
});

const deleteSvgMask = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await svgMaskService.deleteSvgMask(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "SVG Masker succesvol verwijderd",
    data: null,
  });
});

export const svgMaskController = {
  uploadSvgMask,
  getAllSvgMasks,
  bindMaskToTemplate,
  deleteSvgMask,
};
