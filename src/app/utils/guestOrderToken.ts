import crypto from "crypto";

export const generateGuestOrderToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const getGuestOrderTokenExpiry = () => {
  return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
};
