import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { calculatePagination } from "../../utils/calculatePagination";
import { Request, Response } from "express";
import { adminService } from "./admin.service";
import { excludeFiled } from "../../utils/constain";
import { uploadImageToS3 } from "../../utils/uploadAws";
import { uploadToCloudinary } from "../../utils/uploadCloudinary";
import { CloudinaryUploadResponse } from "../user/user.controller";

const totalOrder = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(
    req.query,
  );
  const filter = { ...req.query };

  for (const f of excludeFiled) {
    delete filter[f];
  }
  const orders = await adminService.totalOrder(
    page,
    limit,
    skip,
    filter,
    sortBy,
    sortOrder as "asc" | "desc",
    req.query.searchTerm as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Orders fetched successfully",
    data: orders.orders,
    metaData: orders.metaData,
  });
});

const manageOrder = catchAsync(async (req: Request, res: Response) => {
  const order = await adminService.manageOrder(
    req.params.id as string,
    req.body.status,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order updated successfully",
    data: order,
  });
});

const manageUsers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(
    req.query,
  );
  const filter = { ...req.query };

  for (const f of excludeFiled) {
    delete filter[f];
  }
  const users = await adminService.manageUsers(
    page,
    limit,
    skip,
    filter,
    sortBy,
    sortOrder as "asc" | "desc",
    req.query.searchTerm as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully",
    data: users.users,
    metaData: users.metaData,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const user = await adminService.updateUserStatus(
    req.params.id as string,
    req.body.status,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User status updated successfully",
    data: user,
  });
});

const dashboardStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await adminService.dashboardStats();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard stats fetched successfully",
    data: stats,
  });
});

const totalTransaction = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(
    req.query,
  );
  const filter = { ...req.query };

  for (const f of excludeFiled) {
    delete filter[f];
  }
  const payments = await adminService.totalTransaction(
    page,
    limit,
    skip,
    filter,
    sortBy,
    sortOrder as "asc" | "desc",
    req.query.searchTerm as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Transactions fetched successfully",
    data: payments.payments,
    metaData: payments.metaData,
  });
});

const createDecoration = catchAsync(async (req: Request, res: Response) => {
  const file = req.file;
  if (file) {
    const fileUrl = (await uploadToCloudinary(
      file,
    )) as CloudinaryUploadResponse;
    req.body.element = fileUrl?.secure_url;
    console.log(fileUrl);
  }

  const decoration = await adminService.createDecoration(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Decoration created successfully",
    data: decoration,
  });
});

const deleteDecoration = catchAsync(async (req: Request, res: Response) => {
  await adminService.deleteDecoration(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: null,
    message: "Decoration deleted successfully",
  });
});

const getAllDecoration = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(
    req.query,
  );
  const filter = { ...req.query };

  for (const f of excludeFiled) {
    delete filter[f];
  }
  const decorations = await adminService.getAllDecoration(
    page,
    limit,
    skip,
    filter,
    sortBy,
    sortOrder as "asc" | "desc",
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Decorations fetched successfully",
    data: decorations.decorations,
    metaData: decorations.metaData,
  });
});

const createDecorationCategory = catchAsync(
  async (req: Request, res: Response) => {
    const category = await adminService.createDecorationCategory(req.body.name);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Decoration category created successfully",
      data: category,
    });
  },
);

const getAllDecorationCategory = catchAsync(
  async (req: Request, res: Response) => {
    const categories = await adminService.getAllDecorationCategory();
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Decoration categories fetched successfully",
      data: categories,
    });
  },
);

export const adminController = {
  totalOrder,
  manageOrder,
  manageUsers,
  updateUserStatus,
  dashboardStats,
  totalTransaction,
  createDecoration,
  deleteDecoration,
  getAllDecoration,
  createDecorationCategory,
  getAllDecorationCategory,
};
