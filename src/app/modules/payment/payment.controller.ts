import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { paymentService } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createPayment = catchAsync(async (req: Request, res: Response) => {
    const payment = await paymentService.createPayment(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Payment created successfully",
        data: payment,
    });
});


const mollieWebhook = catchAsync(async (req: Request, res: Response) => {
  const payment = await paymentService.mollieWebhook(req.body.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment webhook successfully",
    data: payment,
  });
});

export const paymentController = {
  createPayment,
  mollieWebhook,
};