import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { orderService } from "./order.service";
import { calculatePagination } from "../../utils/calculatePagination";

const createOrder = async (req: Request & { user?: any }, res: Response) => {
  const order = await orderService.createOrder(
    req.user.id,
    req.body.bannerId,
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
  const order = await orderService.checkOut(
    req.body.orderId,
    req.user.id,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order checked out successfully",
    data: order,
  });
};

const getMyOrders = async (req: Request & { user?: any }, res: Response) => {
  const { page, limit, skip } = calculatePagination(req.query);
  const orders = await orderService.getMyOrders(req.user.id, page, limit, skip);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders fetched successfully",
    data: orders.orders,
    metaData: orders.metaData,
  });
};

const getSingleOrder = async (req: Request & { user?: any }, res: Response) => {
  const order = await orderService.getSingleOrder(
    req.params.id as string,
    req.user.id,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order fetched successfully",
    data: order,
  });
};

const cancledOrder = async (req: Request, res: Response) => {
  await orderService.cancledOrder(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order canceled successfully",
    data: null,
  });
};

export const orderController = {
  createOrder,
  checkOut,
  getMyOrders,
  getSingleOrder,
  cancledOrder,
};
