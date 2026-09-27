import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { pricingSettingService } from "./pricingSetting.service";

const getPricingSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await pricingSettingService.getPricingSetting();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Prijzen en verzendtarieven succesvol opgehaald",
    data: result,
  });
});

const updatePricingSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await pricingSettingService.updatePricingSetting(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Prijzen en verzendtarieven succesvol bijgewerkt",
    data: result,
  });
});

export const pricingSettingController = {
  getPricingSetting,
  updatePricingSetting,
};
