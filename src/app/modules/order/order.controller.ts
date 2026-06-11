import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { orderService } from "./order.service";
import { calculatePagination } from "../../utils/calculatePagination";

const isTruthyFlag = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["1", "true", "yes", "guest"].includes(value.toLowerCase());
  }

  return value === 1;
};

const createOrder = async (req: Request & { user?: any }, res: Response) => {
  const isGuest =
    !req.user?.id ||
    isTruthyFlag(req.body.isGuest) ||
    isTruthyFlag(req.body.guest) ||
    isTruthyFlag(req.query.guest);

  const order = await orderService.createOrder(
    req.user?.id,
    req.body.bannerId,
    {
      ...req.body,
      isGuest,
    },
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bestelling succesvol aangemaakt",
    data: order,
  });
};

const checkOut = async (req: Request & { user?: any }, res: Response) => {
  const order = await orderService.checkOut(
    req.body.orderId,
    req.user?.id,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bestelling succesvol afgerekend",
    data: order,
  });
};

const getMyOrders = async (req: Request & { user?: any }, res: Response) => {
  const { page, limit, skip } = calculatePagination(req.query);
  const orders = await orderService.getMyOrders(req.user.id, page, limit, skip);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bestellingen succesvol opgehaald",
    data: orders.orders,
    metaData: orders.metaData,
  });
};

const getMyDesigns = async (req: Request & { user?: any }, res: Response) => {
  const { page, limit, skip } = calculatePagination(req.query);
  const designs = await orderService.getMyDesigns(
    req.user.id,
    page,
    limit,
    skip,
    {
      savedOnly: isTruthyFlag(req.query.savedOnly),
      includeOrdered: isTruthyFlag(req.query.includeOrdered),
    },
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ontwerpen succesvol opgehaald",
    data: designs.designs,
    metaData: designs.metaData,
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
    message: "Bestelling succesvol opgehaald",
    data: order,
  });
};

const getGuestOrder = async (req: Request, res: Response) => {
  const order = await orderService.getGuestOrder(
    req.params.id as string,
    req.query.token as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Guest bestelling succesvol opgehaald",
    data: order,
  });
};

const cancledOrder = async (req: Request, res: Response) => {
  await orderService.cancledOrder(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bestelling succesvol geannuleerd",
    data: null,
  });
};



export const orderController = {
  createOrder,
  checkOut,
  getMyOrders,
  getSingleOrder,
  getGuestOrder,
  cancledOrder,
  getMyDesigns
};
