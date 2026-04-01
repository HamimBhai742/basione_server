import config from "../../config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

export const connectedDB = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.log("❌ Database connection error:", error);
    process.exit(1);
  }
};

export const seedAdmin = async () => {
  const adminEmail = config.admin.email;

  const hashedPassword = await bcrypt.hash(
    config.admin.password,
    config.password_salt,
  );

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  });

  if (!existingAdmin) {
    // Create admin user
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        name: "Admin",
        isVerified: true,
      },
    });
    console.log("Admin user created successfully");
  } else {
    console.log("Admin user already exists");
  }
};
