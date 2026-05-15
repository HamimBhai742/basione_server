import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { paymentService } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createPayment = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const payment = await paymentService.createPayment(
      req.body,
      req.user.id as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payment created successfully",
      data: payment,
    });
  },
);

const mollieWebhook = catchAsync(async (req: Request, res: Response) => {
  const payId = req.body?.id;
  if (!payId) {
    return res.status(httpStatus.BAD_REQUEST).send("Payment ID not found");
  }
  
  // Fire and forget to respond within Mollie's 10-second timeout window
  paymentService.mollieWebhook(payId).catch(err => {
    console.error("Error processing mollie webhook:", err);
  });
  
  return res.status(200).send("OK");
});

export const paymentController = {
  createPayment,
  mollieWebhook,
};
