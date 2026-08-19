import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/generateToken";
import config from "../../../config";
import { resetPasswordSuccessTemplate } from "../../utils/emailTemplates/resetPasswordSuccessTemplate";
import { verifyToken } from "../../utils/verifyToken";
import { formatAmsterdamDateTime } from "../../utils/deliveryCalculator";
import { generateRefreshToken, getRefreshTokenExpiry } from "../../utils/generateRefreshToken";

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
    config.jwt.secret!,
    config.jwt.expire_in!,
  );

  const refreshToken = generateRefreshToken();
  const refreshTokenExpiresAt = getRefreshTokenExpiry(config.jwt.refresh_expire_in!);

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: hashedRefreshToken,
      refreshTokenExpiresAt,
    },
  });

  return {
    accessToken: token,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

//reset password after verify
const resetPassword = async (userId: string, password: string, token: string) => {
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

  if (!user.forgetPasswordToken || user.forgetPasswordToken !== token) {
    throw new AppError("Ongeldig token", httpStatus.BAD_REQUEST);
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

const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError("Refresh token ontbreekt", httpStatus.UNAUTHORIZED);
  }

  const users = await prisma.user.findMany({
    where: {
      refreshTokenExpiresAt: {
        gt: new Date(),
      },
    },
  });

  let matchedUser = null;
  for (const user of users) {
    if (user.refreshToken && await bcrypt.compare(refreshToken, user.refreshToken)) {
      matchedUser = user;
      break;
    }
  }

  if (!matchedUser) {
    throw new AppError("Ongeldige refresh token", httpStatus.UNAUTHORIZED);
  }

  const newAccessToken = await generateToken(
    matchedUser,
    config.jwt.secret!,
    config.jwt.expire_in!,
  );

  return {
    accessToken: newAccessToken,
  };
};

export const authService = {
  loginUser,
  resetPassword,
  refreshAccessToken,
};
