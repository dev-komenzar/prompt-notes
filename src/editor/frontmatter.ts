/**
 * Frontmatter utilities — ADR-008
 *
 * Body semantics:
 *   - The closing fence `---\n` is NOT part of the body.
 *   - A separator `\n` after the closing fence is NOT part of the body.
 *   - `extractBody(generateNoteContent(tags, body)) === body` must hold (round-trip idempotency).
 *
 * The regex captures everything between opening `---\n` and closing `\n---\n`.
 * After the closing fence we skip exactly one `\n` (the separator) before the body starts.
 */

/**
 * Matches frontmatter block: `---\n<yaml>\n---\n`
 * Captures the entire block including fences.
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
 * Extract body from a note's raw content, stripping frontmatter + separator.
 * ADR-008 compliant.
 */
export function extractBody(raw: string): string {
  return splitRaw(raw).body;
}

/**
 * Generate full note content from tags and body.
 * Produces `---\n<yaml>\n---\n\n<body>` (ADR-008 format).
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
