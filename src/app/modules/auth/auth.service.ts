import { AppError } from "../../error/AppError";
import { prisma } from "../../lib/prisma";
import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/generateToken";
import config from "../../../config";

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



export const authService = {
  loginUser,
};
