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
  console.log("Mollie webhook body:", req.body);

  const payId = req.body.id;

  if (!payId) {
    console.log("Mollie payment id missing");
    return res.status(400).send("Missing payment id");
  }

  const result = await paymentService.mollieWebhook(payId);
  console.log(result);
  return res.status(200).send("OK");
});

export const paymentController = {
  createPayment,
  mollieWebhook,
};
