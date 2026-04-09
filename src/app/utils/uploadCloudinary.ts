import { cloudinary } from "../lib/cloudinary";
import streamifier from "streamifier";

export const uploadToCloudinary = (file: Express.Multer.File) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("File missing"));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "basione",
        resource_type: "image"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};
