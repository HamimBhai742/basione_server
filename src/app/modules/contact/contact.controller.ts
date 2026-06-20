import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { contactService } from "./contact.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const submitContactForm = catchAsync(async (req: Request, res: Response) => {
  await contactService.sendContactEmails(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Uw bericht is succesvol verzonden. We nemen spoedig contact op!",
    data: null,
  });
});

export const contactController = {
  submitContactForm,
};
