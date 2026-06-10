import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { paymentService } from "./payment.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const createPayment = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const payment = await paymentService.createPayment(
      req.body,
      req.user?.id as string | undefined,
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

const getRequestToken = (value: unknown) => {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }

  return typeof value === "string" ? value : undefined;
};

const getGuestOrderToken = (req: Request) =>
  getRequestToken(
    req.query.token ||
      req.query.guestToken ||
      req.query.guestOrderToken ||
      req.body?.token ||
      req.body?.guestToken ||
      req.body?.guestOrderToken,
  );

const syncPaymentStatus = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const payment = await paymentService.syncPaymentStatus(
      getRequestToken(req.params.paymentId),
      req.user as { id?: string; role?: string } | undefined,
      getGuestOrderToken(req),
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payment status fetched successfully",
      data: payment,
    });
  },
);

export const paymentController = {
  createPayment,
  mollieWebhook,
  syncPaymentStatus,
};
