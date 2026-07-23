import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { decorationService } from "./decorations.services";
import { excludeFiled } from "../../utils/constain";
import { calculatePagination } from "../../utils/calculatePagination";

const getAllDecoration = catchAsync(async (req, res) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination({
    sortBy: "createdAt",
    sortOrder: "desc",
    ...req.query,
  });
  const filter = { ...req.query };

  for (const f of excludeFiled) {
    delete filter[f];
  }
  const decorations = await decorationService.getAllDecoration(
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
    data: decorations,
  });
});

export const decorationController = {
  getAllDecoration,
};
