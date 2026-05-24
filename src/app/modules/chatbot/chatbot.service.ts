import { AppError } from "../../error/AppError";
import { chatbotPersistence } from "./chatbot.persistence";
import { chatbotUpstream } from "./chatbot.upstream";

export type ChatbotMessage = {
  role: "user" | "assistant" | "developer";
  content: string;
};

export type ChatbotAskInput = {
  question: string;
  messages?: ChatbotMessage[];
  conversation_id?: string;
  userId?: string | null;
};

export type ChatbotAskOutput = {
  answer: string;
  sources: string[];
  confidence: number;
  is_streaming: false;
  conversation_id?: string;
};

export type ChatbotSettings = {
  isEnabled: boolean;
  websiteKnowledgeEnabled: boolean;
  systemPrompt: string;
  fallbackMessage: string;
  sources: string[];
  allowedDomains: string[];
  maxHistoryMessages: number;
  confidenceThreshold: number;
};

export type ChatbotSettingsInput = Partial<ChatbotSettings>;

export const DEFAULT_CHATBOT_SETTINGS: ChatbotSettings = {
  isEnabled: true,
  websiteKnowledgeEnabled: true,
  systemPrompt:
    "You are a helpful support chatbot for the Spandoek / SpandoekPrint platform. " +
    "Use the available website information, documentation, product, order, payment, delivery, FAQ, and policy context when answering. " +
    "Answer in the same language as the user. Be concise and practical. If you are unsure, say so and ask a short follow-up question.",
  fallbackMessage:
    "Sorry, I could not find enough information to answer that. Please contact support for help.",
  sources: ["Website content", "General Documentation", "FAQ", "Product information"],
  allowedDomains: ["spandoekprint.nl"],
  maxHistoryMessages: 30,
  confidenceThreshold: 0.5,
};

const normalizeText = (value: string) => value.trim();
const SETTINGS_KEY = "global";

const sanitizeStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback;

  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return items.length ? items : fallback;
};

const normalizeSettings = (input: ChatbotSettingsInput = {}): ChatbotSettings => {
  return {
    isEnabled:
      typeof input.isEnabled === "boolean"
        ? input.isEnabled
        : DEFAULT_CHATBOT_SETTINGS.isEnabled,
    websiteKnowledgeEnabled:
      typeof input.websiteKnowledgeEnabled === "boolean"
        ? input.websiteKnowledgeEnabled
        : DEFAULT_CHATBOT_SETTINGS.websiteKnowledgeEnabled,
    systemPrompt:
      typeof input.systemPrompt === "string" && input.systemPrompt.trim()
        ? input.systemPrompt.trim()
        : DEFAULT_CHATBOT_SETTINGS.systemPrompt,
    fallbackMessage:
      typeof input.fallbackMessage === "string" && input.fallbackMessage.trim()
        ? input.fallbackMessage.trim()
        : DEFAULT_CHATBOT_SETTINGS.fallbackMessage,
    sources: sanitizeStringArray(input.sources, DEFAULT_CHATBOT_SETTINGS.sources),
    allowedDomains: sanitizeStringArray(
      input.allowedDomains,
      DEFAULT_CHATBOT_SETTINGS.allowedDomains,
    ),
    maxHistoryMessages:
      typeof input.maxHistoryMessages === "number"
        ? Math.min(Math.max(Math.floor(input.maxHistoryMessages), 1), 100)
        : DEFAULT_CHATBOT_SETTINGS.maxHistoryMessages,
    confidenceThreshold:
      typeof input.confidenceThreshold === "number"
        ? Math.min(Math.max(input.confidenceThreshold, 0), 1)
        : DEFAULT_CHATBOT_SETTINGS.confidenceThreshold,
  };
};

const getSettings = async () => {
  const stored = await chatbotPersistence.getSetting<ChatbotSettingsInput>(
    SETTINGS_KEY,
    DEFAULT_CHATBOT_SETTINGS,
  );

  return normalizeSettings(stored);
};

export const chatbotService = {
  ask: async (input: ChatbotAskInput): Promise<ChatbotAskOutput> => {
    const settings = await getSettings();
    if (!settings.isEnabled) {
      throw new AppError("AI chat is currently disabled", 503);
    }

    const question = normalizeText(input.question);
    if (!question) throw new AppError("question is required", 400);

    const convo = await chatbotPersistence.getOrCreateConversation({
      conversationId: input.conversation_id,
      userId: input.userId || null,
    });

    const previous = await chatbotPersistence.listMessages({
      conversationId: convo.conversationId,
      limit: settings.maxHistoryMessages,
    });

    if (convo.isPersisted && previous.conversationObjectId) {
      await chatbotPersistence.appendMessage({
        conversationObjectId: previous.conversationObjectId,
        role: "user",
        content: question,
      });
    }

    const history: ChatbotMessage[] =
      previous.messages.length > 0
        ? previous.messages.map((m) => ({ role: m.role, content: m.content }))
        : input.messages ?? [];

    // Proxy mode: forward to upstream AI service (already implemented by AI dev)
    const upstreamResp = await chatbotUpstream.ask({
      question,
      conversation_id: convo.conversationId,
      messages: [
        {
          role: "developer",
          content: settings.systemPrompt,
        },
        ...history,
      ],
      settings: {
        websiteKnowledgeEnabled: settings.websiteKnowledgeEnabled,
        allowedDomains: settings.allowedDomains,
        fallbackMessage: settings.fallbackMessage,
      },
    });

    const answer = normalizeText(String(upstreamResp?.answer || ""));
    if (!answer) throw new AppError("Empty AI response", 502);
    const confidence =
      typeof upstreamResp.confidence === "number"
        ? upstreamResp.confidence
        : 0.95;

    if (convo.isPersisted && previous.conversationObjectId) {
      await chatbotPersistence.appendMessage({
        conversationObjectId: previous.conversationObjectId,
        role: "assistant",
        content: answer,
        model: null,
      });
    }

    return {
      answer:
        confidence < settings.confidenceThreshold
          ? settings.fallbackMessage
          : answer,
      sources:
        upstreamResp.sources && upstreamResp.sources.length
          ? upstreamResp.sources
          : settings.sources,
      confidence,
      is_streaming: false,
      conversation_id: convo.conversationId,
    };
  },

  getSettings,

  updateSettings: async (
    input: ChatbotSettingsInput,
    updatedBy?: string | null,
  ) => {
    const current = await getSettings();
    const next = normalizeSettings({
      ...current,
      ...input,
    });

    return chatbotPersistence.upsertSetting({
      key: SETTINGS_KEY,
      value: next,
      updatedBy,
    });
  },

  listConversations: chatbotPersistence.listConversations,

  getConversation: async (conversationId: string) => {
    const conversation = await chatbotPersistence.getConversation(conversationId);

    if (!conversation) {
      throw new AppError("Chatbot conversation not found", 404);
    }

    return conversation;
  },

  deleteConversation: async (conversationId: string) => {
    const deleted = await chatbotPersistence.deleteConversation(conversationId);

    if (!deleted) {
      throw new AppError("Chatbot conversation not found", 404);
    }

    return true;
  },

  getDocumentationSummary: async (query: Record<string, unknown>) => {
    return chatbotUpstream.get("/api/chatbot/documentation/summary", query);
  },

  searchDocumentation: async (query: Record<string, unknown>) => {
    return chatbotUpstream.get("/api/chatbot/documentation/search", query);
  },
};
