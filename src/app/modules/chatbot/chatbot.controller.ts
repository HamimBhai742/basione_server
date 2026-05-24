import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { chatbotService } from "./chatbot.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { calculatePagination } from "../../utils/calculatePagination";

const ask = catchAsync(async (req: Request, res: Response) => {
  const result = await chatbotService.ask({
    ...req.body,
    userId: (req as any).user?.id || null,
  });
  res.status(200).json(result);
});

const getSettings = catchAsync(async (_req: Request, res: Response) => {
  const result = await chatbotService.getSettings();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chatbot settings fetched successfully",
    data: result,
  });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await chatbotService.updateSettings(
    req.body,
    (req as any).user?.id || null,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chatbot settings updated successfully",
    data: result.value || result,
  });
});

const listConversations = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = calculatePagination(req.query);

  const result = await chatbotService.listConversations({
    page,
    limit,
    skip,
    searchTerm: req.query.searchTerm as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chatbot conversations fetched successfully",
    data: result.conversations,
    metaData: result.metaData,
  });
});

const getConversation = catchAsync(async (req: Request, res: Response) => {
  const result = await chatbotService.getConversation(
    req.params.conversationId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chatbot conversation fetched successfully",
    data: result,
  });
});

const deleteConversation = catchAsync(async (req: Request, res: Response) => {
  await chatbotService.deleteConversation(req.params.conversationId as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chatbot conversation deleted successfully",
    data: null,
  });
});

const getDocumentationSummary = catchAsync(
  async (req: Request, res: Response) => {
    const result = await chatbotService.getDocumentationSummary(
      req.query as Record<string, unknown>,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Chatbot documentation summary fetched successfully",
      data: result,
    });
  },
);

const searchDocumentation = catchAsync(async (req: Request, res: Response) => {
  const result = await chatbotService.searchDocumentation(
    req.query as Record<string, unknown>,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Chatbot documentation search fetched successfully",
    data: result,
  });
});

export const chatbotController = {
  ask,
  getSettings,
  updateSettings,
  listConversations,
  getConversation,
  deleteConversation,
  getDocumentationSummary,
  searchDocumentation,
};
