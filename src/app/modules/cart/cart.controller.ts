import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { cartService } from "./cart.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const getCart = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await cartService.getCart(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Winkelwagen succesvol opgehaald",
    data: result,
  });
});

const addToCart = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await cartService.addToCart(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product toegevoegd aan winkelwagen",
    data: result,
  });
});

const updateCartItem = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await cartService.updateCartItem(
    req.user.id,
    req.params.id as string,
    req.body
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Winkelwagen bijgewerkt",
    data: result,
  });
});

const removeFromCart = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await cartService.removeFromCart(req.user.id, req.params.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product verwijderd uit winkelwagen",
    data: result,
  });
});

const syncCart = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await cartService.syncCart(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Gastwinkelwagen succesvol gesynchroniseerd",
    data: result,
  });
});

export const cartController = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  syncCart,
};
