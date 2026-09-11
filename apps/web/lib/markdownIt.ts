/**
 * Shared MarkdownIt renderer configured for rich survey descriptions and notifications.
 * HTML, line breaks, and auto-linkification are enabled so user-provided markdown renders
 * naturally in the UI without manual conversion at every call site.
 */
import MarkdownIt from "markdown-it";

export const md = new MarkdownIt("default", { html: true, breaks: true, linkify: true });
