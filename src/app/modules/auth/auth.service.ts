import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/generateToken";
import config from "../../../config";
import { resetPasswordSuccessTemplate } from "../../utils/emailTemplates/resetPasswordSuccessTemplate";
import { verifyToken } from "../../utils/verifyToken";

interface IUserPayload {
  email: string;
  password: string;
}

const loginUser = async (payload: IUserPayload) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  if (!user.isVerified) {
    throw new AppError("User is not verified", httpStatus.BAD_REQUEST);
  }

  if (user.status !== "active") {
    throw new AppError("User is not active", httpStatus.BAD_REQUEST);
  }

  const isPasswordMatch = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordMatch) {
    throw new AppError("Incorrect password", httpStatus.UNAUTHORIZED);
  }

  const token = await generateToken(
    user,
    config.jwt.secret,
    config.jwt.expire_in,
  );

  return {
    accessToken: token,
  };
};

//reset password after verify
const resetPassword = async (userId: string, password: string) => {
  if (!userId) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  if (
    user.forgetPasswordTokenExpires &&
    user.forgetPasswordTokenExpires < new Date()
  ) {
    throw new AppError("Token has expired", httpStatus.BAD_REQUEST);
  }

  const hashedPassword = await bcrypt.hash(password, config.password_salt);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
      forgetPasswordToken: null,
      forgetPasswordTokenExpires: null,
    },
  });

  // await otpQueueEmail.add(
  //   "resetPasswordSuccess",
  //   {
  //     userName: user.name,
  //     email: user.email,
  //   },
  //   {
  //     jobId: `${user.id}-${Date.now()}`,
  //     removeOnComplete: true,
  //     attempts: 3,
  //     backoff: { type: "fixed", delay: 5000 },
  //   },
  // );

  await resetPasswordSuccessTemplate({
    userName: user.name,
    email: user.email,
    resetAt: new Date().toLocaleString(),
  });
  return null;
};
export const authService = {
  loginUser,
  resetPassword,
};
