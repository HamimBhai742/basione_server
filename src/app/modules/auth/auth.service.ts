import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/generateToken";
import config from "../../../config";
import { resetPasswordSuccessTemplate } from "../../utils/emailTemplates/resetPasswordSuccessTemplate";
import { verifyToken } from "../../utils/verifyToken";
import { formatAmsterdamDateTime } from "../../utils/deliveryCalculator";

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
    throw new AppError("Gebruiker niet gevonden", httpStatus.NOT_FOUND);
  }

  if (!user.isVerified) {
    throw new AppError("Gebruiker is niet geverifieerd", httpStatus.BAD_REQUEST);
  }

  if (user.status !== "active") {
    throw new AppError("Gebruiker is niet actief", httpStatus.BAD_REQUEST);
  }

  const isPasswordMatch = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordMatch) {
    throw new AppError("Onjuist wachtwoord", httpStatus.UNAUTHORIZED);
  }

  const token = await generateToken(
    user,
    config.jwt.secret as string,
    config.jwt.expire_in as string,
  );

  return {
    accessToken: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

//reset password after verify
const resetPassword = async (userId: string, password: string) => {
  if (!userId) {
    throw new AppError("Gebruiker niet gevonden", httpStatus.NOT_FOUND);
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError("Gebruiker niet gevonden", httpStatus.NOT_FOUND);
  }

  if (
    user.forgetPasswordTokenExpires &&
    user.forgetPasswordTokenExpires < new Date()
  ) {
    throw new AppError("Token is verlopen", httpStatus.BAD_REQUEST);
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

  await resetPasswordSuccessTemplate({
    userName: user.name,
    email: user.email,
    resetAt: formatAmsterdamDateTime(new Date()),
  });
  return null;
};


export const authService = {
  loginUser,
  resetPassword,
};
