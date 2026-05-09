import DOMPurify from "isomorphic-dompurify";

export function sanitizeNoteHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "span"],
    ALLOWED_ATTR: [],
  });
}
