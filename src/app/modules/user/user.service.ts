import bcrypt from "bcrypt";
import config from "../../../config";
import { prisma } from "../../lib/prisma";
import { otpQueueEmail } from "../../bullMQ/init";
import { generateOtp } from "../../utils/generateOtp";
import { AppError } from "../../error/AppError";
import httpStatus from "http-status";
import { generateToken } from "../../utils/generateToken";
import { verifyToken } from "../../utils/verifyToken";
import { email } from "zod";

interface IUserPayload {
  name: string;
  email: string;
  password: string;
}
const registerUser = async (payload: IUserPayload) => {
  const isExistingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  if (isExistingUser && !isExistingUser.isVerified) {
    await otpQueueEmail.add("registrationOtp", {
      userName: isExistingUser.name,
      email: isExistingUser.email,
      otpCode: otp,
      subject: "Email Verification Code",
    });
    return isExistingUser;
  }

  if (isExistingUser) {
    throw new AppError("User already exists", httpStatus.CONFLICT);
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.password_salt,
  );
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      otp,
      otpExpiry,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await otpQueueEmail.add(
    "registrationOtp",
    {
      userName: user.name,
      email: user.email,
      otpCode: otp,
      subject: "Email Verification Code",
    },
    {
      jobId: `${user.id}-${Date.now()}`,
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: "fixed", delay: 5000 },
    },
  );
  return user;
};

const verifyOtp = async (otp: string, email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  if (user.otp !== otp) {
    throw new AppError("Invalid OTP", httpStatus.BAD_REQUEST);
  }

  if (user?.otpExpiry && user.otpExpiry < new Date()) {
    throw new AppError("OTP has expired", httpStatus.BAD_REQUEST);
  }

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      isVerified: true,
      otp: null,
      otpExpiry: null,
    },
  });

  const token = await generateToken(
    user,
    config.jwt.secret,
    config.jwt.expire_in,
  );
  return {
    accessToken: token,
  };
};

const resendOtp = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      otp,
      otpExpiry,
    },
  });

  await otpQueueEmail.add(
    "registrationOtp",
    {
      userName: user.name,
      email: user.email,
      otpCode: otp,
      subject: "Email Verification Code",
    },
    {
      jobId: `${user.id}-${Date.now()}`,
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: "fixed", delay: 5000 },
    },
  );
  return null;
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
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

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  const tempToken = await generateToken(user, config.jwt.secret, "2m");

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      otp: otp,
      otpExpiry,
      forgetPasswordToken: tempToken,
      forgetPasswordTokenExpires: otpExpiry,
    },
  });

  await otpQueueEmail.add(
    "passwordResetRequest",
    {
      userName: user.name,
      email: user.email,
      otpCode: otp,
      subject: "Password Reset Code",
    },
    {
      jobId: `${user.id}-${Date.now()}`,
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: "fixed", delay: 5000 },
    },
  );
  return {
    accessToken: tempToken,
  };
};

const resendForgotPassOtp = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
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

  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  const tempToken = await generateToken(user, config.jwt.secret, "2m");

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      otp: otp,
      otpExpiry,
      forgetPasswordToken: tempToken,
      forgetPasswordTokenExpires: otpExpiry,
    },
  });

  await otpQueueEmail.add(
    "passwordResetRequest",
    {
      userName: user.name,
      email: user.email,
      otpCode: otp,
      subject: "Password Reset Code",
    },
    {
      jobId: `${user.id}-${Date.now()}`,
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: "fixed", delay: 5000 },
    },
  );
  return {
    accessToken: tempToken,
  };
};

const verifyForgotOtp = async (otp: string, email: string, token: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }
  if (user.forgetPasswordToken !== token) {
    throw new AppError("Invalid token", httpStatus.BAD_REQUEST);
  }

  if (user.otp !== otp) {
    throw new AppError("Invalid OTP", httpStatus.BAD_REQUEST);
  }

  if (
    (user?.otpExpiry && user.otpExpiry < new Date()) ||
    (user.forgetPasswordTokenExpires &&
      user.forgetPasswordTokenExpires < new Date())
  ) {
    throw new AppError("OTP has expired", httpStatus.BAD_REQUEST);
  }

  const tempToken = await generateToken(user, config.jwt.secret, "2m");
  const expiry = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      forgetPasswordToken: tempToken,
      forgetPasswordTokenExpires: expiry,
      otp: null,
      otpExpiry: null,
    },
  });

  return {
    accessToken: tempToken,
  };
};

const resetPassword = async (token: string, password: string) => {
  const decoded = verifyToken(token, config.jwt.secret);

  const user = await prisma.user.findUnique({
    where: {
      email: decoded.email,
    },
  });

  if (!user) {
    throw new AppError("User not found", httpStatus.NOT_FOUND);
  }

  if (user.forgetPasswordToken !== token) {
    throw new AppError("Invalid token", httpStatus.BAD_REQUEST);
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
      email: decoded.email,
    },
    data: {
      password: hashedPassword,
      forgetPasswordToken: null,
      forgetPasswordTokenExpires: null,
    },
  });

  await otpQueueEmail.add(
    "resetPasswordSuccess",
    {
      userName: user.name,
      email: user.email,
    },
    {
      jobId: `${user.id}-${Date.now()}`,
      removeOnComplete: true,
      attempts: 3,
      backoff: { type: "fixed", delay: 5000 },
    },
  );
  return null;
};

export const userService = {
  registerUser,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
  resendForgotPassOtp,
};
