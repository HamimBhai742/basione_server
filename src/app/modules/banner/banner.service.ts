import { Request } from "express";
import { prisma } from "../../lib/prisma";
import axios from "axios";
import FormData from "form-data";
import { AppError } from "../../error/AppError";
import config from "../../../config";
import { uploadToCloudinary } from "../../utils/uploadCloudinary";
import { CloudinaryUploadResponse } from "../user/user.controller";
export enum ICategory {
  wedding = "wedding",
  birthday = "birthday",
  kids_party = "party",
  baby_shower = "baby_shower",
  engagement = "engagement",
}

type AuthRequest = Request & {
  user?: any;
  file?: Express.Multer.File;
};

const createBanner = async (req: AuthRequest) => {
  const parsedData = req.body;
  console.log(parsedData);

  const formData = new FormData();

  formData.append(
    "data",
    JSON.stringify({
      occasion: parsedData?.occasion,
      style: parsedData?.style,
      headline: parsedData?.headline || "",
      subtext: parsedData?.subheadline || "",
      name: parsedData?.name || "",
      age: parsedData?.age || "",
      // size: ` ${parsedData.size.width}x${parsedData.size.height}`,
      description:
        parsedData.description || "A banner for a wedding invitation",
    }),
  );
  console.log({
    occasion: parsedData?.occasion,
    style: parsedData?.style,
    headline: parsedData?.headline || "",
    subtext: parsedData?.subheadline || "",
    name: parsedData?.name || "",
    age: parsedData?.age || "",
    size: `${parsedData.size.width}x${parsedData.size.height}`,
    description: parsedData.description || "A banner for a wedding invitation",

  });

  if (req.file) {
    formData.append("ref_image_1", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
  }

  formData.append("ref_image_2", "");
  formData.append("ref_image_3", "");
  formData.append("ref_image_4", "");

  const response = await axios.post(
    "https://pennant-upswing-corny.ngrok-free.dev/generate",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        accept: "application/json",
      },
      responseType: "stream",
      validateStatus: () => true,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  );

  let price = 0;
  const height = Number(parsedData.size.height);
  const width = Number(parsedData.size.width);
  if (height <= 40 && width <= 80) {
    price = 30;
  } else if (height <= 75 && width <= 150) {
    price = 50;
  } else if (height <= 160 && width <= 200) {
    price = 80;
  } else if (height <= 200 && width <= 240) {
    price = 100;
  } else {
    price = 60;
  }

  // const banners = await prisma.banner.findMany({
  //   take: 4,
  //   orderBy: { createdAt: "desc" },
  // });
  // return {
  //   variants: banners,
  // };

  if (response.status >= 400) {
    let rawError = "";

    await new Promise<void>((resolve, reject) => {
      response.data.on("data", (chunk: Buffer) => {
        rawError += chunk.toString("utf-8");
      });

      response.data.on("end", () => resolve());
      response.data.on("error", reject);
    });

    throw new AppError(`AI server is shutting down`, 400);
  }

  return new Promise((resolve, reject) => {
    const finalVariants: {
      variant: number;
      url: string | null;
      image_b64?: string | null;
      revised_prompt?: string;
    }[] = [];

    let buffer = "";
    let isFinished = false;

    const saveAndResolve = async () => {
      if (isFinished) return;
      isFinished = true;

      const sortedVariants = [...finalVariants].sort(
        (a, b) => a.variant - b.variant,
      );

      const savedBanners = await Promise.all(
        sortedVariants.map((item) =>
          prisma.banner.create({
            data: {
              userId: req.user?.id || null,

              occasion: parsedData.occasion,
              style: parsedData.style,
              headline: parsedData.headline,
              name: parsedData.name,

              hobbies: parsedData.hobbies || [],
              description: parsedData.description,

              sizeType: parsedData.size.type,
              sizeLabel: parsedData.size.label,
              width: parsedData.size.width,
              height: parsedData.size.height,

              imageUrl: item.url ?? "",
              variant: item.variant,
              price,

              revisedPrompt: item.revised_prompt || null,
            },
          }),
        ),
      );

      resolve({
        variants: savedBanners,
      });
    };

    response.data.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf-8");
      buffer += text;

      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        const lines = part.split("\n");
        const dataLines: string[] = [];

        for (const line of lines) {
          const trimmedLine = line.trim();

          if (trimmedLine.startsWith("data:")) {
            dataLines.push(trimmedLine.replace("data:", "").trim());
          }
        }

        const dataStr = dataLines.join("");
        if (!dataStr) continue;

        let data: any;
        try {
          data = JSON.parse(dataStr);
        } catch {
          data = dataStr;
        }

        const event = data?.event?.trim?.();

        console.log("EVENT:", event);
        console.log("DATA:", data);

        if (event === "final") {
          finalVariants.push({
            variant: data?.variant ?? null,
            url: data?.url ?? null,
            image_b64: data?.image_b64 ?? null,
            revised_prompt: data?.revised_prompt ?? "",
          });
        }

        if (event === "error") {
          if (!isFinished) {
            isFinished = true;
            reject(
              new AppError(data?.message || "AI server returned an error"),
            );
          }
          return;
        }

        if (event === "all_done") {
          saveAndResolve().catch((err) => {
            if (!isFinished) {
              isFinished = true;
              reject(err);
            }
          });
          return;
        }
      }
    });

    response.data.on("end", () => {
      saveAndResolve().catch((err) => {
        if (!isFinished) {
          isFinished = true;
          reject(err);
        }
      });
    });

    response.data.on("error", (err: Error) => {
      if (!isFinished) {
        isFinished = true;
        reject(err);
      }
    });
  });
};

const createBannerByTemplate = async (req: AuthRequest) => {
  const parsedData = JSON.parse(req?.body.data);
  console.log(parsedData, req.file);
  let occ = "";
  let headline = "";
  if (parsedData.size === "party-banner") {
    occ = "party";
    headline = "Welcome to the party";
  } else if (parsedData.size === "blessing-sign") {
    occ = "wedding";
    headline = "We are getting married";
  } else if (parsedData.size === "birthday-backdrop") {
    occ = "birthday";
    headline = `Happy birthday`;
  } else {
    occ = "custom";
    headline = "Custom Banner";
  }

  let price = 0;
  const height = Number(parsedData.height);
  const width = Number(parsedData.width);
  if (height <= 40 && width <= 80) {
    price = 30;
  } else if (height <= 120 && width <= 160) {
    price = 50;
  } else if (height <= 150 && width <= 200) {
    price = 80;
  } else if (height <= 200 && width <= 240) {
    price = 100;
  } else {
    price = 60;
  }
  console.log(occ, headline, price, parsedData, height, width);
  const formatLabel = (text: string) => {
    return text
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  let imgUrl = "";
  if (req?.file) {
    const img = (await uploadToCloudinary(
      req.file,
    )) as CloudinaryUploadResponse;
    imgUrl = img?.secure_url;
  }
  const sizeLabel = formatLabel(parsedData.size);
  const banner = await prisma.banner.create({
    data: {
      headline,
      occasion: occ,
      imageUrl: imgUrl,
      price,
      width,
      height,
      sizeType: parsedData.size,
      sizeLabel,
      style: "Template",
      variant: 0,
    },
  });
  return banner;
};

const updateBanner = async (req: AuthRequest, bannerId: string) => {
  const banner = await prisma.banner.findUnique({
    where: {
      id: bannerId,
    },
  });

  if (!banner) {
    throw new Error("Banner not found");
  }

  let parsedData: any = null;

  if (req?.body?.data) {
    parsedData =
      typeof req.body.data === "string"
        ? JSON.parse(req.body.data)
        : req.body.data;
  }

  const formatLabel = (text: string) => {
    return text
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  let occasion = banner.occasion;
  let headline = banner.headline;

  if (parsedData?.size === "party-banner") {
    occasion = "party";
    headline = "Welcome to the party";
  } else if (parsedData?.size === "blessing-sign") {
    occasion = "wedding";
    headline = "We are getting married";
  } else if (parsedData?.size === "birthday-backdrop") {
    occasion = "birthday";
    headline = `Happy birthday ${banner.name}`;
  }

  const width = Number(parsedData?.width);
  const height = Number(parsedData?.height);

  let price = banner.price;

  if (parsedData?.width && parsedData?.height) {
    if (height < 80 && width < 120) {
      price = 20;
    } else if (height < 120 && width < 160) {
      price = 30;
    } else if (height < 160 && width < 200) {
      price = 40;
    } else if (height < 200 && width < 240) {
      price = 50;
    } else {
      price = 60;
    }
  }

  let imageUrl = "";

  if (req?.file) {
    const img = (await uploadToCloudinary(
      req.file,
    )) as CloudinaryUploadResponse;

    imageUrl = img?.secure_url;
  }

  const updateData: any = {};

  if (imageUrl) {
    updateData.imageUrl = imageUrl;
  }

  if (parsedData?.size) {
    updateData.headline = headline;
    updateData.occasion = occasion;
    updateData.price = price;
    updateData.sizeType = parsedData.size;
    updateData.sizeLabel = formatLabel(parsedData.size);
  }

  if (parsedData?.width) {
    updateData.width = width;
  }

  if (parsedData?.height) {
    updateData.height = height;
  }

  const updatedBanner = await prisma.banner.update({
    where: {
      id: bannerId,
    },
    data: updateData,
  });

  return updatedBanner;
};

// const createBanner = async (req: AuthRequest) => {
//   const parsedData = req.body;
//   console.log(parsedData);

//   let occ = "";
//   let headline = "";

//   if (parsedData.size.type === "party-banner") {
//     occ = "party";
//     headline = "Welcome to the party";
//   } else if (parsedData.size.type === "blessing-sign") {
//     occ = "wedding";
//     headline = "We are getting married";
//   } else if (parsedData.size.type === "birthday-banner") {
//     occ = "birthday";
//     headline = `Happy birthday ${parsedData.name}`;
//   } else {
//     occ = parsedData.occasion;
//     headline = parsedData.headline;
//   }

//   console.log(occ, headline);

//   const formData = new FormData();

//   formData.append(
//     "data",
//     JSON.stringify({
//       occasion: occ,
//       style: parsedData?.style?.toLowerCase(),
//       headline: headline || "",
//       height: `${parsedData.size.height}cm`,
//       width: `${parsedData.size.width}cm`,
//       description:
//         parsedData.description || "A banner for a wedding invitation",
//     }),
//   );

//   if (req.file) {
//     formData.append("ref_image_1", req.file.buffer, {
//       filename: req.file.originalname,
//       contentType: req.file.mimetype,
//     });
//   }

//   formData.append("ref_image_2", "");
//   formData.append("ref_image_3", "");
//   formData.append("ref_image_4", "");

//   const response = await axios.post(`${config.baseUrl}/generate`, formData, {
//     headers: {
//       ...formData.getHeaders(),
//       accept: "text/event-stream",
//     },
//     responseType: "stream",
//     validateStatus: () => true,
//     maxBodyLength: Infinity,
//     maxContentLength: Infinity,
//     timeout: 1000 * 60 * 5,
//   });

//   let price = 0;
//   const height = Number(parsedData.size.height);
//   const width = Number(parsedData.size.width);

//   if (height < 80 && width < 120) {
//     price = 20;
//   } else if (height < 120 && width < 160) {
//     price = 30;
//   } else if (height < 160 && width < 200) {
//     price = 40;
//   } else if (height < 200 && width < 240) {
//     price = 50;
//   } else {
//     price = 60;
//   }

//   console.log("Banner price:", price);

//   if (response.status >= 400) {
//     let rawError = "";

//     await new Promise<void>((resolve, reject) => {
//       response.data.on("data", (chunk: Buffer) => {
//         rawError += chunk.toString("utf-8");
//       });

//       response.data.on("end", () => resolve());
//       response.data.on("error", reject);
//     });

//     throw new AppError(`AI server error ${response.status}: ${rawError}`);
//   }

//   return new Promise((resolve, reject) => {
//     const finalVariants: {
//       variant: number;
//       url: string | null;
//       image_b64?: string | null;
//       revised_prompt?: string;
//     }[] = [];

//     let buffer = "";
//     let isFinished = false;
//     let receivedAllDone = false;

//     const saveAndResolve = async () => {
//       if (isFinished) return;

//       if (!receivedAllDone) {
//         throw new AppError(
//           "Banner generation did not complete successfully. all_done event not received.",
//         );
//       }

//       if (!finalVariants.length) {
//         throw new AppError("No final banner variants were generated.");
//       }

//       isFinished = true;

//       const sortedVariants = [...finalVariants].sort(
//         (a, b) => a.variant - b.variant,
//       );

//       // optional duplicate protection
//       const uniqueVariants = sortedVariants.filter(
//         (item, index, self) =>
//           index === self.findIndex((v) => v.variant === item.variant),
//       );

//       const savedBanners = await prisma.$transaction(
//         uniqueVariants.map((item) =>
//           prisma.banner.create({
//             data: {
//               userId: req.user?.id || null,

//               occasion: occ,
//               style: parsedData.style,
//               headline: headline,
//               name: parsedData.name,

//               hobbies: parsedData.hobbies || [],
//               description: parsedData.description,

//               sizeType: parsedData.size.type,
//               sizeLabel: parsedData.size.label,
//               width: parsedData.size.width,
//               height: parsedData.size.height,

//               imageUrl: item.url ?? "",
//               variant: item.variant,
//               price,

//               revisedPrompt: item.revised_prompt || null,
//             },
//           }),
//         ),
//       );

//       resolve({
//         variants: savedBanners,
//       });
//     };

//     response.data.on("data", (chunk: Buffer) => {
//       const text = chunk.toString("utf-8");
//       buffer += text;

//       const parts = buffer.split("\n\n");
//       buffer = parts.pop() || "";

//       for (const part of parts) {
//         const lines = part.split("\n");
//         const dataLines: string[] = [];

//         for (const line of lines) {
//           const trimmedLine = line.trim();

//           if (trimmedLine.startsWith("data:")) {
//             dataLines.push(trimmedLine.replace("data:", "").trim());
//           }
//         }

//         const dataStr = dataLines.join("");
//         if (!dataStr) continue;

//         let data: any;

//         try {
//           data = JSON.parse(dataStr);
//         } catch {
//           data = dataStr;
//         }

//         const event = data?.event?.trim?.();

//         console.log("EVENT:", event);
//         console.log("DATA:", data);

//         if (event === "final") {
//           if (
//             typeof data?.variant === "number" &&
//             (data?.url || data?.image_b64)
//           ) {
//             finalVariants.push({
//               variant: data.variant,
//               url: data.url ?? null,
//               image_b64: data.image_b64 ?? null,
//               revised_prompt: data.revised_prompt ?? "",
//             });
//           }
//         }

//         if (event === "error") {
//           if (!isFinished) {
//             isFinished = true;
//             reject(
//               new AppError(data?.message || "AI server returned an error"),
//             );
//           }
//           return;
//         }

//         if (event === "all_done") {
//           receivedAllDone = true;

//           saveAndResolve().catch((err) => {
//             if (!isFinished) {
//               isFinished = true;
//               reject(err);
//             }
//           });
//           return;
//         }
//       }
//     });

//     response.data.on("end", () => {
//       if (!receivedAllDone && !isFinished) {
//         isFinished = true;
//         reject(
//           new AppError("Connection ended before banner generation completed."),
//         );
//       }
//     });

//     response.data.on("error", (err: Error) => {
//       if (!isFinished) {
//         isFinished = true;
//         console.log(err.name,"gfgfgfg")
//         reject(new AppError(err.message || "Stream connection failed"));
//       }
//     });
//   });
// };
const mybanner = async (id: string) => {
  const banner = await prisma.banner.findMany({
    where: {
      userId: id,
    },
  });
  return banner;
};

const getAllbanners = async (
  page: number,
  limit: number,
  skip: number,
  category?: string,
  fetchFrom?: "home" | "gallery",
) => {
  console.log(category)
  const banners = await prisma.banner.findMany({
    skip,
    take: fetchFrom === "home" ? 6 : limit,
    where: {
      occasion: category ? category : undefined,
    },
    orderBy: {
      createdAt: "desc",
    }
  });

  const total = await prisma.banner.count({
    where: {
      occasion: category ? category : undefined,
    },
  });

  return {
    banners,
    metaData: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSelectedBanner = async (id: string) => {
  await prisma.banner.update({
    where: {
      id,
    },
    data: {
      isSelected: true,
      status: "SELECTED",
    },
  });
  const banner = await prisma.banner.findUnique({
    where: {
      id,
    },
  });
  return banner;
};

export const bannerService = {
  mybanner,
  createBanner,
  getAllbanners,
  getSelectedBanner,
  createBannerByTemplate,
  updateBanner,
};
