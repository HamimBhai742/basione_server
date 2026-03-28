import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { paymentService } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const successPayment = catchAsync(async (req: Request, res: Response) => {
  const order = await paymentService.successPayment(
    req.query.orderId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment successfull",
    data: order,
  });
});

const cancelPayment = catchAsync(async (req: Request, res: Response) => {
  const order = await paymentService.cancelePayment(
    req.query.orderId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment canceled",
    data: order,
  });
});

export const paymentController = {
  successPayment,
  cancelPayment,
};
