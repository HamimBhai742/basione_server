import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { alertBarService } from "./alertBar.service";

const getAlertBarSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await alertBarService.getAlertBarSetting();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Alert bar settings fetched successfully",
    data: result,
  });
});

const updateAlertBarSetting = catchAsync(async (req: Request, res: Response) => {
  const result = await alertBarService.updateAlertBarSetting(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Alert bar settings updated successfully",
    data: result,
  });
});

export const alertBarController = {
  getAlertBarSetting,
  updateAlertBarSetting,
};
