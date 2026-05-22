import axios from "axios";
import { AppError } from "../../error/AppError";

export type UpstreamAskResponse = {
  answer: string;
  sources?: string[];
  confidence?: number;
  is_streaming?: boolean;
  conversation_id?: string;
};

const getUpstreamConfig = () => {
  const baseURL = process.env.CHATBOT_UPSTREAM_BASE_URL;
  const askPath = process.env.CHATBOT_UPSTREAM_ASK_PATH || "/api/chatbot/ask";
  const streamPath =
    process.env.CHATBOT_UPSTREAM_STREAM_PATH || "/api/chatbot/ask/stream";

  if (!baseURL) {
    throw new AppError("CHATBOT_UPSTREAM_BASE_URL is missing", 500);
  }
  const selfBase = process.env.BASE_URL;
  if (selfBase && baseURL.replace(/\/+$/, "") === selfBase.replace(/\/+$/, "")) {
    throw new AppError("CHATBOT_UPSTREAM_BASE_URL must not point to this same server (would loop)", 500);
  }

  return { baseURL, askPath, streamPath };
};

export const chatbotUpstream = {
  get: async (path: string, params?: Record<string, unknown>) => {
    const { baseURL } = getUpstreamConfig();
    const url = `${baseURL}${path}`;

    const resp = await axios.get(url, {
      params,
      validateStatus: () => true,
      timeout: 60000,
    });

    if (resp.status >= 400) {
      throw new AppError(
        (resp.data && (resp.data.message || resp.data.error)) ||
          `Upstream error (${resp.status})`,
        502,
      );
    }

    return resp.data;
  },

  ask: async (body: unknown) => {
    const { baseURL, askPath } = getUpstreamConfig();
    const url = `${baseURL}${askPath}`;

    const resp = await axios.post(url, body, {
      headers: { "Content-Type": "application/json", accept: "application/json" },
      validateStatus: () => true,
      timeout: 120000,
    });

    if (resp.status >= 400) {
      throw new AppError(
        (resp.data && (resp.data.message || resp.data.error)) ||
          `Upstream error (${resp.status})`,
        502,
      );
    }

    return resp.data as UpstreamAskResponse;
  },

  stream: async (body: unknown) => {
    const { baseURL, streamPath } = getUpstreamConfig();
    const url = `${baseURL}${streamPath}`;

    const resp = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        accept: "application/x-ndjson, text/event-stream, application/json",
      },
      responseType: "stream",
      validateStatus: () => true,
      timeout: 120000,
    });

    if (resp.status >= 400) {
      let message = `Upstream error (${resp.status})`;
      try {
        // Try to read a small piece of the error stream
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve) => {
          resp.data.on("data", (c: Buffer) => {
            chunks.push(c);
            if (Buffer.concat(chunks).length > 2048) resolve();
          });
          resp.data.on("end", resolve);
          resp.data.on("error", resolve);
        });
        const text = Buffer.concat(chunks).toString("utf8").trim();
        if (text) message = text.slice(0, 400);
      } catch {
        // ignore
      }
      throw new AppError(message, 502);
    }

    return {
      stream: resp.data as NodeJS.ReadableStream,
      headers: resp.headers as Record<string, string | string[] | undefined>,
      status: resp.status,
    };
  },
};
