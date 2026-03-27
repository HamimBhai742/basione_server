import "dotenv/config";
export default {
  port: Number(process.env.PORT) || 3000,
  password_salt: Number(process.env.PASSWORD_SALT) || 10
};
