import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { wishlistService } from "./wishlist.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const getWishlist = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await wishlistService.getWishlist(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Verlanglijst succesvol opgehaald",
    data: result,
  });
});

const toggleWishlist = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const { bannerId } = req.body;
  const result = await wishlistService.toggleWishlist(req.user.id, bannerId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.isFavorited
      ? "Ontwerp toegevoegd aan verlanglijst"
      : "Ontwerp verwijderd uit verlanglijst",
    data: result,
  });
});

const syncWishlist = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await wishlistService.syncWishlist(req.user.id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Gastverlanglijst succesvol gesynchroniseerd",
    data: result,
  });
});

export const wishlistController = {
  getWishlist,
  toggleWishlist,
  syncWishlist,
};
