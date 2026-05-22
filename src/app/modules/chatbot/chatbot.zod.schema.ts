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

