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

const getConfig = () => {
  return {
    sources: ["General Documentation"],
    confidence: 0.95,
  };
};

const normalizeText = (value: string) => value.trim();

export const chatbotService = {
  ask: async (input: ChatbotAskInput): Promise<ChatbotAskOutput> => {
    const { sources, confidence } = getConfig();

    const question = normalizeText(input.question);
    if (!question) throw new AppError("question is required", 400);

    const convo = await chatbotPersistence.getOrCreateConversation({
      conversationId: input.conversation_id,
      userId: input.userId || null,
    });

    const previous = await chatbotPersistence.listMessages({
      conversationId: convo.conversationId,
      limit: 30,
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
      messages: history,
    });

    const answer = normalizeText(String(upstreamResp?.answer || ""));
    if (!answer) throw new AppError("Empty AI response", 502);

    if (convo.isPersisted && previous.conversationObjectId) {
      await chatbotPersistence.appendMessage({
        conversationObjectId: previous.conversationObjectId,
        role: "assistant",
        content: answer,
        model: null,
      });
    }

    return {
      answer,
      sources: upstreamResp.sources && upstreamResp.sources.length ? upstreamResp.sources : sources,
      confidence: typeof upstreamResp.confidence === "number" ? upstreamResp.confidence : confidence,
      is_streaming: false,
      conversation_id: convo.conversationId,
    };
  },
};
