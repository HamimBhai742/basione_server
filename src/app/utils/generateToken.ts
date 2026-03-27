import jwt from "jsonwebtoken";

export const generateToken = (user: any, secret: any, expiresIn: any) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, secret, { expiresIn });
};
