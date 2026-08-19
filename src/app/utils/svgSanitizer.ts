import { AppError } from "../error/AppError";

/**
 * Sanitizes raw SVG content by stripping out scripts, event handlers,
 * javascript: links, and potentially dangerous tags like <foreignObject>.
 * This prevents XSS attacks while keeping vector path data intact.
 */
export function sanitizeSvg(svgContent: string): string {
  if (!svgContent) {
    throw new AppError("Lege SVG-inhoud ontvangen");
  }

  let sanitized = svgContent;

  // 1. Remove script tags: <script>...</script>
  sanitized = sanitized.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "");

  // 2. Remove foreignObject tags (can contain HTML/JS)
  sanitized = sanitized.replace(/<foreignObject\b[^>]*>([\s\S]*?)<\/foreignObject>/gi, "");

  // 3. Remove iframe, object, embed, applet tags
  sanitized = sanitized.replace(/<(iframe|object|embed|applet)\b[^>]*>([\s\S]*?)<\/\1>/gi, "");

  // 4. Remove event handlers like onload, onclick, etc.
  // Matches "onsomething='...'" or "onsomething="..." or "onsomething=..."
  sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi, "");

  // 5. Remove javascript: URIs in href, xlink:href, etc.
  sanitized = sanitized.replace(/href\s*=\s*(['"]\s*javascript:[^'"]*['"]|[^\s>]+)/gi, 'href=""');
  sanitized = sanitized.replace(/xlink:href\s*=\s*(['"]\s*javascript:[^'"]*['"]|[^\s>]+)/gi, 'xlink:href=""');

  return sanitized;
}
