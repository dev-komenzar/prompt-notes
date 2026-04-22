/**
 * ADR-008 compliant frontmatter handling (TypeScript side).
 *
 * Public API (per editor_clipboard_design.md §3.1):
 * - `extractBody(raw)` — body extraction for edit-mode copy
 * - `generateNoteContent(tags, body)` — note content construction
 *
 * Internal helpers below are NOT exported because frontend is forbidden from
 * re-parsing IPC responses (see editor_clipboard_design.md §3.3 prohibition 1).
 *
 * Layout: `---\n<yaml>\n---\n\n<body>`
 * - Opening fence: `---\n`
 * - YAML block
 * - Closing fence: `---\n`
 * - Separator: `\n` (single blank line between closing fence and body)
 * - Body: remaining text (does NOT include the separator \n)
 */

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n/;

function splitRaw(raw: string): { frontmatter: string; body: string } {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: "", body: raw };
  }
  const fmEnd = match[0].length;
  const body = raw.substring(fmEnd + 1);
  return { frontmatter: match[0], body };
}

/**
 * Extract body from raw note content (for display/copy).
 */
export function extractBody(raw: string): string {
  return splitRaw(raw).body;
}

/**
 * Generate complete note content from tags and body.
 * Produces ADR-008 compliant format.
 */
export function generateNoteContent(tags: string[], body: string): string {
  const tagLines =
    tags.length > 0
      ? tags.map((t) => `  - ${t}`).join("\n")
      : "";
  const yamlContent = tagLines
    ? `tags:\n${tagLines}`
    : "tags: []";
  return `---\n${yamlContent}\n---\n\n${body}`;
}
