import "dotenv/config";
export default {
  port: Number(process.env.PORT) || 3000,
  password_salt: Number(process.env.PASSWORD_SALT) || 10,
  smt: {
    email: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expire_in: process.env.JWT_EXPIRES_IN,
  },
  stripe: {
    secret: process.env.STRIPE_SECRET_KEY as string,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET as string,
  },
};
