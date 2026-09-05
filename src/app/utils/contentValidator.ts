import { AppError } from "../error/AppError";
import httpStatus from "http-status";

const FORBIDDEN_PLACEHOLDER_REGEXES = [
  { pattern: /\bproducttitel\b/i, label: "producttitel" },
  { pattern: /lorem\s+ipsum/i, label: "lorem ipsum" },
  { pattern: /\blorem\b/i, label: "lorem" },
  { pattern: /sit\s+inventore/i, label: "sit inventore" },
  { pattern: /\b(asperiores|voluptatem\s+officia|quis\s+dolores)\b/i, label: "lorem filler" },
];

/**
 * Validates that user/admin submitted content does not contain dummy/placeholder text.
 * Throws an AppError with 400 Bad Request if forbidden placeholders are detected.
 */
export function assertNoDummyContent(text: string | null | undefined, fieldName: string): void {
  if (!text || typeof text !== "string") return;

  for (const item of FORBIDDEN_PLACEHOLDER_REGEXES) {
    if (item.pattern.test(text)) {
      throw new AppError(
        `Het veld '${fieldName}' bevat niet-toegestane placeholder/dummy tekst ('${item.label}'). Voer een geldige en unieke tekst in.`,
        httpStatus.BAD_REQUEST
      );
    }
  }
}

/**
 * Strips placeholder words such as 'producttitel' from a string cleanly.
 */
export function cleanDummyPlaceholders(text: string): string {
  if (!text || typeof text !== "string") return text;
  let cleaned = text;
  cleaned = cleaned.replace(/\bproducttitel\b\s*[-–:]?\s*/gi, "");
  cleaned = cleaned.replace(/\blorem\s+ipsum\b/gi, "");
  return cleaned.trim();
}
