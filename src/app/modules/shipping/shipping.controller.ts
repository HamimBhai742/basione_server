import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { shippingService } from "./shipping.service";

const getShippingMethods = catchAsync(async (req: Request, res: Response) => {
  const methods = await shippingService.getShippingMethods();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QLS shipping methods fetched successfully",
    data: methods,
  });
});

const getSetupCompanies = catchAsync(async (req: Request, res: Response) => {
  const companies = await shippingService.getSetupCompanies();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QLS companies fetched successfully",
    data: companies,
  });
});

const getSetupBrands = catchAsync(async (req: Request, res: Response) => {
  const brands = await shippingService.getSetupBrands(
    req.params.companyId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QLS brands fetched successfully",
    data: brands,
  });
});

const getSetupProducts = catchAsync(async (req: Request, res: Response) => {
  const products = await shippingService.getSetupProducts(
    req.params.companyId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QLS products fetched successfully",
    data: products,
  });
});

const getSetupProductCombinations = catchAsync(
  async (req: Request, res: Response) => {
    const combinations = await shippingService.getSetupProductCombinations(
      req.params.companyId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "QLS product combinations fetched successfully",
      data: combinations,
    });
  },
);

const getSupportedCarriers = catchAsync(async (_req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QLS carriers fetched successfully",
    data: shippingService.getSupportedCarriers(),
  });
});

const createShipment = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const shipment = await shippingService.createShipment(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "QLS shipment created successfully",
      data: shipment,
    });
  },
);

const getOrderShipment = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const shipments = await shippingService.getOrderShipment(
      req.params.orderId as string,
      req.user,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "QLS shipments fetched successfully",
      data: shipments,
    });
  },
);

const refreshShipment = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const shipment = await shippingService.refreshShipment(
      req.params.orderId as string,
      req.user,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "QLS shipment tracking refreshed successfully",
      data: shipment,
    });
  },
);

const downloadLabel = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const label = await shippingService.downloadLabel(
      req.params.shipmentId as string,
      req.user,
    );

    res.setHeader("Content-Type", label.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${label.filename}"`,
    );
    return res.status(httpStatus.OK).send(label.buffer);
  },
);

const getWebhookTypes = catchAsync(async (req: Request, res: Response) => {
  const types = await shippingService.getWebhookTypes();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "QLS webhook types fetched successfully",
    data: types,
  });
});

const registerWebhook = catchAsync(async (req: Request, res: Response) => {
  const webhook = await shippingService.registerWebhook(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "QLS webhook registered successfully",
    data: webhook,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  const expectedSecret = config.qls.webhookSecret;

  if (expectedSecret) {
    const incomingSecret =
      req.headers["x-qls-webhook-secret"] || req.query.secret;

    if (incomingSecret !== expectedSecret) {
      return res.status(httpStatus.UNAUTHORIZED).send("Unauthorized");
    }
  }

  await shippingService.handleWebhook(req.body);
  return res.status(httpStatus.OK).send("OK");
});

export const shippingController = {
  getShippingMethods,
  getSetupCompanies,
  getSetupBrands,
  getSetupProducts,
  getSetupProductCombinations,
  getSupportedCarriers,
  createShipment,
  getOrderShipment,
  refreshShipment,
  downloadLabel,
  getWebhookTypes,
  registerWebhook,
  handleWebhook,
};
