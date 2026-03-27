import bcrypt from "bcrypt";
import config from "../../../config";
import { prisma } from "../../lib/prisma";
import { otpQueueEmail } from "../../bullMQ/init";
import { generateOtp } from "../../utils/generateOtp";
import { AppError } from "../../error/AppError";
import httpStatus from "http-status";
import { generateToken } from "../../utils/generateToken";

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

  await otpQueueEmail.add("registrationOtp", {
    userName: user.name,
    email: user.email,
    otpCode: otp,
    subject: "Email Verification Code",
  });
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

  await otpQueueEmail.add("registrationOtp", {
    userName: user.name,
    email: user.email,
    otpCode: otp,
    subject: "Email Verification Code",
  });
  return null;
};

export const userService = {
  registerUser,
  verifyOtp,
  resendOtp,
};
