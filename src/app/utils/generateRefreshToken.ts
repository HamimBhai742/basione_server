import crypto from "crypto";

export const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const getRefreshTokenExpiry = (expiryStr = "7d"): Date => {
  const match = expiryStr.match(/^(\d+)d$/);
  const days = match ? parseInt(match[1], 10) : 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};
