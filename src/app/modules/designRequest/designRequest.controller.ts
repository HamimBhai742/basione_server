import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { designRequestService } from "./designRequest.service";

const createDesignRequest = catchAsync(async (req: Request, res: Response) => {
  const { name, email, phone, dimensions, eyelets, requirements } = req.body;
  const files = req.files as Express.Multer.File[] | undefined;

  const result = await designRequestService.createDesignRequest({
    name,
    email,
    phone,
    dimensions,
    eyelets,
    requirements,
    files,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Uw design aanvraag is succesvol ontvangen! Ons ontwerpteam neemt zo snel mogelijk contact met u op.",
    data: result,
  });
});

export const designRequestController = {
  createDesignRequest,
};
