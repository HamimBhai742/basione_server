import bcrypt from "bcrypt";
import config from "../../../config";
import { prisma } from "../../lib/prisma";

interface IUserPayload {
  name: string;
  email: string;
  password: string;
}
const registerUser = async (payload: IUserPayload) => {
  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.password_salt,
  );

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};
