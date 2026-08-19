import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { aggregateService } from "./aggregate.services";
import { verifyToken } from "../../utils/verifyToken";
import config from "../../../config";
import { prisma } from "../../lib/prisma";

const getAggregateData = catchAsync(async (req, res) => {
  let userId: string | undefined;

  let token = req.headers.authorization || req.cookies?.accessToken;
  if (token) {
    // Handle standard Bearer prefix if present
    if (token.startsWith("Bearer ")) {
      token = token.split(" ")[1];
    }

    try {
      const decoded = verifyToken(token, config.jwt.secret!);
      if (decoded && decoded.email) {
        const user = await prisma.user.findUnique({
          where: {
            email: decoded.email,
          },
        });

        if (user && user.isVerified && user.status === "active") {
          userId = user.id;
        }
      }
    } catch (error) {
      // Gracefully fall back to returning public data if token is invalid/expired
    }
  }

  const result = await aggregateService.getAggregateData(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All aggregated GET API data fetched successfully",
    data: result,
  });
});

export const aggregateController = {
  getAggregateData,
};
