import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const generateToken = (
  user: TokenPayload,
  secret: string,
  expiresIn: string,
) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, secret, { expiresIn } as any);
};
