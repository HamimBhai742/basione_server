import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { chatbotAskSchema } from "./chatbot.zod.schema";
import { chatbotController } from "./chatbot.controller";
import { randomUUID } from "crypto";
import { chatbotPersistence } from "./chatbot.persistence";
import { chatbotUpstream } from "./chatbot.upstream";
import { chatbotService } from "./chatbot.service";

const router = Router();

router.post("/ask", validateRequest(chatbotAskSchema), chatbotController.ask);

const streamHandler = async (req: any, res: any) => {
  const settings = await chatbotService.getSettings();
  if (!settings.isEnabled) {
    return res.status(503).json({
      success: false,
      message: "AI chat is currently disabled",
    });
  }

  const convo = await chatbotPersistence.getOrCreateConversation({
    conversationId:
      typeof req.body.conversation_id === "string" && req.body.conversation_id
        ? req.body.conversation_id
        : undefined,
    userId: req.user?.id || null,
  });

  const message_id = randomUUID();

  res.status(200);
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let clientClosed = false;
  req.on("close", () => {
    clientClosed = true;
  });

  const writeLine = (obj: unknown) => {
    res.write(`${JSON.stringify(obj)}\n`);
  };

  writeLine({
    type: "meta",
    is_streaming: true,
    conversation_id: convo.conversationId,
    message_id,
    created_at: new Date().toISOString(),
  });

  const previous = await chatbotPersistence.listMessages({
    conversationId: convo.conversationId,
    limit: settings.maxHistoryMessages,
  });

  const messages = [
    {
      role: "developer" as const,
      content: settings.systemPrompt,
    },
    ...(previous.messages.length > 0
      ? previous.messages.map((m) => ({ role: m.role, content: m.content }))
      : Array.isArray(req.body.messages)
        ? req.body.messages
        : []),
    {
      role: "user" as const,
      content: String(req.body.question || "").trim(),
    },
  ];

  let answer = "";
  const userQuestion = messages[messages.length - 1]?.content || "";
  if (!userQuestion) {
    writeLine({ type: "error", message: "question is required" });
    writeLine({
      type: "done",
      answer: "",
      sources: settings.sources,
      confidence: 0.95,
      conversation_id: convo.conversationId,
      message_id,
    });
    return res.end();
  }

  if (convo.isPersisted && previous.conversationObjectId) {
    await chatbotPersistence.appendMessage({
      conversationObjectId: previous.conversationObjectId,
      role: "user",
      content: userQuestion,
    });
  }

  try {
    const upstream = await chatbotUpstream.stream({
      question: userQuestion,
      conversation_id: convo.conversationId,
      messages: messages.filter((m: any) => m.role !== "developer"),
      settings: {
        websiteKnowledgeEnabled: settings.websiteKnowledgeEnabled,
        allowedDomains: settings.allowedDomains,
        fallbackMessage: settings.fallbackMessage,
      },
    });

    const upstreamStream = upstream.stream;
    let buffer = "";

    const emitDelta = (delta: string) => {
      if (!delta) return;
      answer += delta;
      writeLine({ type: "delta", delta });
    };

    const handleLine = (rawLine: string) => {
      const line = rawLine.trim();
      if (!line) return;
      if (line === "[DONE]") return;

      const maybeData = line.startsWith("data:") ? line.slice(5).trim() : line;
      if (!maybeData) return;

      try {
        const obj = JSON.parse(maybeData);
        if (typeof obj?.delta === "string") return emitDelta(obj.delta);
        if (typeof obj?.content === "string") return emitDelta(obj.content);
        if (typeof obj?.answer === "string") return emitDelta(obj.answer);
        if (typeof obj?.data === "string") return emitDelta(obj.data);
        return;
      } catch {
        // Not JSON, treat as plain text
        emitDelta(maybeData);
      }
    };

    await new Promise<void>((resolve, reject) => {
      upstreamStream.on("data", (chunk: Buffer) => {
        if (clientClosed) {
          try {
            (upstreamStream as any).destroy?.();
          } catch {
            // ignore
          }
          return resolve();
        }

        const text = chunk.toString("utf8");
        buffer += text;

        // Prefer newline-delimited parsing if possible
        let idx: number;
        while ((idx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          handleLine(line);
        }

        // If upstream streams raw text without newlines, prevent unbounded buffering
        if (buffer.length > 2048 && buffer.indexOf("\n") === -1) {
          emitDelta(buffer);
          buffer = "";
        }
      });
      upstreamStream.on("end", () => resolve());
      upstreamStream.on("error", (e: any) => reject(e));
    });

    if (buffer.trim()) handleLine(buffer);

    if (convo.isPersisted && previous.conversationObjectId) {
      await chatbotPersistence.appendMessage({
        conversationObjectId: previous.conversationObjectId,
        role: "assistant",
        content: answer.trim(),
        model: null,
        isPartial: false,
      });
    }

    writeLine({
      type: "done",
      answer: answer.trim(),
      sources: settings.sources,
      confidence: 0.95,
      conversation_id: convo.conversationId,
      message_id,
    });

    res.end();
  } catch (err: any) {
    const message =
      err?.name === "AbortError" ? "Client disconnected" : err?.message || "AI error";

    writeLine({ type: "error", message });

    if (convo.isPersisted && previous.conversationObjectId && answer.trim()) {
      await chatbotPersistence.appendMessage({
        conversationObjectId: previous.conversationObjectId,
        role: "assistant",
        content: answer.trim(),
        model: null,
        isPartial: true,
      });
    }

    writeLine({
      type: "done",
      answer: answer.trim(),
      sources: settings.sources,
      confidence: 0.95,
      conversation_id: convo.conversationId,
      message_id,
    });
    res.end();
  }
};

// NDJSON streaming endpoint for easy browser integration (fetch + reader)
router.post("/stream", validateRequest(chatbotAskSchema), streamHandler);
// Alias to match existing frontend/swagger pattern: /api/chatbot/ask/stream
router.post("/ask/stream", validateRequest(chatbotAskSchema), streamHandler);

router.get("/conversation/:conversation_id", async (req, res) => {
  const conversation_id = String(req.params.conversation_id || "").trim();
  const result = await chatbotPersistence.listMessages({ conversationId: conversation_id, limit: 200 });
  res.status(200).json({
    conversation_id,
    messages: result.messages.map((m) => ({ role: m.role, content: m.content, createdAt: m.createdAt, isPartial: m.isPartial })),
  });
});

// Proxy upstream documentation endpoints (matches upstream swagger)
router.get("/documentation/summary", async (req, res) => {
  const data = await chatbotUpstream.get("/api/chatbot/documentation/summary", req.query as any);
  res.status(200).json(data);
});

router.get("/documentation/search", async (req, res) => {
  const data = await chatbotUpstream.get("/api/chatbot/documentation/search", req.query as any);
  res.status(200).json(data);
});

export const chatbotRoutes = router;
