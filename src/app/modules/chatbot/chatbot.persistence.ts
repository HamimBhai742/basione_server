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
const settingDelegate = () => (prisma as any).chatbotSetting;

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

  getSetting: async <T>(key: string, fallback: T): Promise<T> => {
    try {
      const setting = await settingDelegate().findUnique({
        where: { key },
        select: { value: true },
      });

      return setting?.value ? (setting.value as T) : fallback;
    } catch {
      return fallback;
    }
  },

  upsertSetting: async <T>(opts: { key: string; value: T; updatedBy?: string | null }) => {
    const setting = await settingDelegate().upsert({
      where: { key: opts.key },
      update: {
        value: opts.value,
        updatedBy: opts.updatedBy || null,
      },
      create: {
        key: opts.key,
        value: opts.value,
        updatedBy: opts.updatedBy || null,
      },
    });

    return setting;
  },

  listConversations: async (opts: {
    page: number;
    limit: number;
    skip: number;
    searchTerm?: string;
  }) => {
    try {
      const where = opts.searchTerm
        ? {
            OR: [
              { conversationId: { contains: opts.searchTerm, mode: "insensitive" } },
              { title: { contains: opts.searchTerm, mode: "insensitive" } },
            ],
          }
        : {};

      const [conversations, total] = await Promise.all([
        conversationDelegate().findMany({
          where,
          orderBy: { updatedAt: "desc" },
          take: opts.limit,
          skip: opts.skip,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                role: true,
                content: true,
                createdAt: true,
                isPartial: true,
              },
            },
          },
        }),
        conversationDelegate().count({ where }),
      ]);

      return {
        conversations,
        metaData: {
          total,
          page: opts.page,
          limit: opts.limit,
          totalPages: Math.ceil(total / opts.limit),
        },
      };
    } catch {
      return {
        conversations: [],
        metaData: {
          total: 0,
          page: opts.page,
          limit: opts.limit,
          totalPages: 0,
        },
      };
    }
  },

  getConversation: async (conversationId: string) => {
    try {
      return await conversationDelegate().findUnique({
        where: { conversationId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          messages: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              role: true,
              content: true,
              model: true,
              isPartial: true,
              createdAt: true,
            },
          },
        },
      });
    } catch {
      return null;
    }
  },

  deleteConversation: async (conversationId: string) => {
    const convo = await conversationDelegate().findUnique({
      where: { conversationId },
      select: { id: true },
    });

    if (!convo) return false;

    await prisma.$transaction([
      messageDelegate().deleteMany({
        where: { conversationObjectId: convo.id },
      }),
      conversationDelegate().delete({
        where: { conversationId },
      }),
    ]);

    return true;
  },
};
