import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { chatbotService } from "./chatbot.service";

const ask = catchAsync(async (req: Request, res: Response) => {
  const result = await chatbotService.ask({
    ...req.body,
    userId: (req as any).user?.id || null,
  });
  res.status(200).json(result);
});

export const chatbotController = {
  ask,
};
