import axios, { AxiosError, AxiosInstance } from "axios";
import httpStatus from "http-status";
import config from "../../../config";
import { AppError } from "../../error/AppError";

type QlsContact = {
  name: string;
  companyname: string;
  street: string;
  housenumber: string;
  address2?: string;
  postalcode: string;
  locality: string;
  country: string;
  email?: string;
  phone?: string;
};

export type QlsShipmentProduct = {
  amount: number;
  name: string;
  country_code_of_origin?: string;
  hs_code?: string;
  price_per_unit?: number;
  weight_per_unit?: number;
  ean?: string;
  sku?: string;
  currency?: string;
};

export type QlsCreateShipmentPayload = {
  product_combination_id: number;
  brand_id: string;
  servicepoint_code?: string;
  reference?: string;
  weight?: number;
  customs_invoice_number?: string;
  customs_shipment_type?: "commercial" | "documents" | "return" | "sample";
  receiver_contact: QlsContact;
  shipment_products?: QlsShipmentProduct[];
  zpl_direct?: boolean;
};

type QlsWebhookPayload = {
  url: string;
  type_id: number;
};

const getAxiosErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Unknown QLS error";
  }

  const axiosError = error as AxiosError<any>;
  const responseData = axiosError.response?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData?.errors?.length) {
    return Array.isArray(responseData.errors)
      ? responseData.errors.join(", ")
      : String(responseData.errors);
  }

  if (responseData?.message) {
    return responseData.message;
  }

  return axiosError.message;
};

class QlsClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: config.qls.baseUrl,
      auth: {
        username: config.qls.username || "",
        password: config.qls.password || "",
      },
      timeout: 30000,
    });
  }

  assertAuthConfigured() {
    const missing = [
      ["QLS_USERNAME", config.qls.username],
      ["QLS_PASSWORD", config.qls.password],
    ].filter(([, value]) => !value);

    if (missing.length > 0) {
      throw new AppError(
        `QLS is not configured: ${missing.map(([key]) => key).join(", ")}`,
        httpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  assertConfigured() {
    this.assertAuthConfigured();

    const missing = [
      ["QLS_COMPANY_ID", config.qls.companyId],
      ["QLS_BRAND_ID", config.qls.brandId],
    ].filter(([, value]) => !value);

    if (missing.length > 0) {
      throw new AppError(
        `QLS is not configured: ${missing.map(([key]) => key).join(", ")}`,
        httpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCompanies() {
    this.assertAuthConfigured();
    const { data } = await this.request(() => this.http.get("/companies"));

    return data?.data || data;
  }

  async getBrands(companyId: string) {
    this.assertAuthConfigured();
    const { data } = await this.request(() =>
      this.http.get(`/companies/${companyId}/brands`),
    );

    return data?.data || data;
  }

  async getProducts(companyId: string) {
    this.assertAuthConfigured();
    const { data } = await this.request(() =>
      this.http.get(`/companies/${companyId}/products`),
    );

    return data?.data || data;
  }

  async getShippingMethods() {
    this.assertConfigured();
    const { data } = await this.request(() =>
      this.http.get(`/companies/${config.qls.companyId}/products`),
    );

    return data;
  }

  async createShipment(payload: QlsCreateShipmentPayload) {
    this.assertConfigured();
    const { data } = await this.request(() =>
      this.http.post(
        `/v2/companies/${config.qls.companyId}/shipments`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    return data?.data || data;
  }

  async getShipment(qlsShipmentId: string, includeLabel = false) {
    this.assertConfigured();
    const { data } = await this.request(() =>
      this.http.get(
        `/companies/${config.qls.companyId}/shipments/${qlsShipmentId}`,
        {
          params: {
            returnShipmentLabel: includeLabel || undefined,
          },
        },
      ),
    );

    return data?.data || data;
  }

  async downloadLabel(labelUrl: string) {
    this.assertConfigured();
    const { data, headers } = await this.request(() =>
      this.http.get<ArrayBuffer>(labelUrl, {
        responseType: "arraybuffer",
      }),
    );

    return {
      buffer: Buffer.from(data),
      contentType: headers["content-type"] || "application/pdf",
    };
  }

  async getWebhookTypes() {
    this.assertConfigured();
    const { data } = await this.request(() =>
      this.http.get(`/v2/companies/${config.qls.companyId}/webhook-types`),
    );

    return data?.data || data;
  }

  async registerWebhook(payload: QlsWebhookPayload) {
    this.assertConfigured();
    const body = new URLSearchParams();
    body.set("url", payload.url);
    body.set("type_id", String(payload.type_id));

    const { data } = await this.request(() =>
      this.http.post(`/v2/companies/${config.qls.companyId}/webhooks`, body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    );

    return data?.data || data;
  }

  private async request<T>(callback: () => Promise<T>) {
    try {
      return await callback();
    } catch (error) {
      throw new AppError(
        getAxiosErrorMessage(error),
        axios.isAxiosError(error)
          ? error.response?.status || httpStatus.BAD_GATEWAY
          : httpStatus.BAD_GATEWAY,
      );
    }
  }
}

export const qlsClient = new QlsClient();
