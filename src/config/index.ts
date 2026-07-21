import "dotenv/config";
import { cloudinary } from "../app/lib/cloudinary";
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
  admin: {
    email: process.env.ADMIN_EMAIL as string,
    contact: {
      email: process.env.ADMIN_EMAIL_CONTACT as string,
    },
    password: process.env.ADMIN_PASSWORD as string,
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
    api_key: process.env.CLOUDINARY_API_KEY as string,
    api_secret: process.env.CLOUDINARY_API_SECRET as string,
  },
  baseUrl: process.env.BASE_URL as string,
  client_url: process.env.CLIENT_URL as string,
  reviewBaseUrl: process.env.REVIEW_BASE_URL as string,
  NODE_ENV: process.env.NODE_ENV as string,
  s3: {
    region: process.env.S3_REGION as string,
    endpoint: process.env.S3_ENDPOINT as string,
    name: process.env.S3_BUCKET_NAME as string,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    },
  },
  qls: {
    baseUrl: process.env.QLS_BASE_URL || "https://api.pakketdienstqls.nl",
    username: process.env.QLS_USERNAME as string,
    password: process.env.QLS_PASSWORD as string,
    companyId: process.env.QLS_COMPANY_ID as string,
    brandId: process.env.QLS_BRAND_ID as string,
    defaultProductCombinationId: Number(
      process.env.QLS_DEFAULT_PRODUCT_COMBINATION_ID || 0,
    ),
    carriers: {
      dhl: Number(process.env.QLS_DHL_PRODUCT_COMBINATION_ID || 0),
      dragonfly: Number(process.env.QLS_DRAGONFLY_PRODUCT_COMBINATION_ID || 0),
      dpd: Number(process.env.QLS_DPD_PRODUCT_COMBINATION_ID || 0),
      postnl: Number(process.env.QLS_POSTNL_PRODUCT_COMBINATION_ID || 0),
    },
    defaultWeightGram: Number(process.env.QLS_DEFAULT_WEIGHT_GRAM || 1000),
    defaultCountry: process.env.QLS_DEFAULT_COUNTRY || "NL",
    webhookSecret: process.env.QLS_WEBHOOK_SECRET as string,
  },
  webwinkelkeur: {
    shopId: process.env.WEBWINKELKEUR_SHOP_ID as string,
    apiKey: process.env.WEBWINKELKEUR_API_KEY as string,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID as string,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  },
};
