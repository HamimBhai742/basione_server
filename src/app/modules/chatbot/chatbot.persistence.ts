import { randomUUID } from "crypto";
import { prisma } from "../../lib/prisma";

export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant" | "developer";
  content: string;
  createdAt: Date;
  isPartial?: boolean;
};

type ConversationRecord = {
  id: string;
  conversationId: string;
  userId?: string | null;
  title?: string | null;
};

const conversationDelegate = () => (prisma as any).chatbotConversation;
const messageDelegate = () => (prisma as any).chatbotMessage;

export const chatbotPersistence = {
  getOrCreateConversation: async (opts: { conversationId?: string; userId?: string | null }) => {
    const conversationId = opts.conversationId || randomUUID();

    let convo: ConversationRecord | null = null;
    try {
      convo = await conversationDelegate().findUnique({
        where: { conversationId },
      });
    } catch {
      // If prisma client hasn't been regenerated yet, delegates may not exist.
      // We still return an id-like conversationId so the API remains usable.
      return { id: conversationId, conversationId, isPersisted: false as const };
    }

    if (convo) {
      return { id: convo.id, conversationId: convo.conversationId, isPersisted: true as const };
    }

    const created = await conversationDelegate().create({
      data: {
        conversationId,
        userId: opts.userId || null,
      },
      select: { id: true, conversationId: true },
    });

    return { id: created.id as string, conversationId: created.conversationId as string, isPersisted: true as const };
  },

  appendMessage: async (opts: {
    conversationObjectId: string;
    role: "user" | "assistant" | "developer";
    content: string;
    model?: string | null;
    isPartial?: boolean;
  }) => {
    try {
      const created = await messageDelegate().create({
        data: {
          conversationObjectId: opts.conversationObjectId,
          role: opts.role,
          content: opts.content,
          model: opts.model || null,
          isPartial: Boolean(opts.isPartial),
        },
        select: { id: true, role: true, content: true, createdAt: true, isPartial: true },
      });

      return {
        id: created.id as string,
        role: created.role as StoredChatMessage["role"],
        content: created.content as string,
        createdAt: created.createdAt as Date,
        isPartial: created.isPartial as boolean,
        isPersisted: true as const,
      };
    } catch {
      return { id: randomUUID(), role: opts.role, content: opts.content, createdAt: new Date(), isPartial: opts.isPartial, isPersisted: false as const };
    }
  },

  listMessages: async (opts: { conversationId: string; limit?: number }) => {
    const limit = opts.limit ?? 30;
    try {
      const convo = await conversationDelegate().findUnique({
        where: { conversationId: opts.conversationId },
        select: { id: true },
      });
      if (!convo) return { conversationObjectId: null as string | null, messages: [] as StoredChatMessage[] };

      const messages = await messageDelegate().findMany({
        where: { conversationObjectId: convo.id },
        orderBy: { createdAt: "asc" },
        take: limit,
        select: { id: true, role: true, content: true, createdAt: true, isPartial: true },
      });

      return {
        conversationObjectId: convo.id as string,
        messages: (messages as any[]).map((m) => ({
          id: String(m.id),
          role: m.role as StoredChatMessage["role"],
          content: String(m.content),
          createdAt: m.createdAt as Date,
          isPartial: Boolean(m.isPartial),
        })),
      };
    } catch {
      return { conversationObjectId: null as string | null, messages: [] as StoredChatMessage[] };
    }
  },
};

