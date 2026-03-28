import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { orderService } from "./order.service";

const createOrder = async (req: Request & { user?: any }, res: Response) => {
  const order = await orderService.createOrder(
    req.user.id,
    req.body.designId,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order created successfully",
    data: order,
  });
};


const checkOut = async (req: Request & { user?: any }, res: Response) => {
  const order = await orderService.checkOut(req.body.orderId, req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order checked out successfully",
    data: order,
  });
};


export const orderController = {
  createOrder,
  checkOut
};
