import z from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "developer"]),
  content: z
    .string({ message: "content is required" })
    .min(1, { message: "content cannot be empty" })
    .max(8000, { message: "content is too long" }),
});

export const chatbotAskSchema = z.object({
  question: z
    .string({ message: "question is required" })
    .min(1, { message: "question cannot be empty" })
    .max(4000, { message: "question is too long" }),
  messages: z.array(messageSchema).max(30).optional(),
  conversation_id: z.string().max(200).optional(),
});

export const chatbotSettingsSchema = z.object({
  isEnabled: z.boolean().optional(),
  websiteKnowledgeEnabled: z.boolean().optional(),
  systemPrompt: z.string().min(1).max(5000).optional(),
  fallbackMessage: z.string().min(1).max(1000).optional(),
  sources: z.array(z.string().min(1).max(200)).max(20).optional(),
  allowedDomains: z.array(z.string().min(1).max(200)).max(20).optional(),
  maxHistoryMessages: z.number().int().min(1).max(100).optional(),
  confidenceThreshold: z.number().min(0).max(1).optional(),
});
