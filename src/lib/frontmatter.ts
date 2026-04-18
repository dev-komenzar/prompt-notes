/**
 * ADR-008 compliant frontmatter handling (TypeScript side).
 *
 * Layout: `---\n<yaml>\n---\n\n<body>`
 * - Opening fence: `---\n`
 * - YAML block (no trailing newline within YAML; each field ends with \n)
 * - Closing fence: `---\n`
 * - Separator: `\n` (single blank line between closing fence and body)
 * - Body: remaining text (does NOT include the separator \n)
 *
 * Round-trip invariant: serializeFrontmatter(splitRaw(raw)) === raw
 */

export interface ParsedNote {
  rawFrontmatter: string; // includes opening/closing fences
  body: string;
  tags: string[];
}

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n/;

/**
 * Split raw .md content into frontmatter + body parts.
 */
export function splitRaw(raw: string): { frontmatter: string; body: string } {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: "", body: raw };
  }
  const fmEnd = match[0].length;
  // After closing fence there is a separator \n
  const body = raw.substring(fmEnd + 1); // skip the \n separator
  return { frontmatter: match[0], body };
}

/**
 * Parse tags from YAML frontmatter string.
 */
export function parseTags(frontmatter: string): string[] {
  const tags: string[] = [];
  const lines = frontmatter.split("\n");
  let inTags = false;

  for (const line of lines) {
    if (line.startsWith("tags:")) {
      inTags = true;
      // Check inline: tags: [a, b]
      const inline = line.match(/tags:\s*\[([^\]]*)\]/);
      if (inline) {
        return inline[1]
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      }
      continue;
    }
    if (inTags) {
      if (line.match(/^\s+-\s+/)) {
        const tag = line.replace(/^\s+-\s+/, "").trim();
        if (tag) tags.push(tag);
      } else {
        break;
      }
    }
  }
  return tags;
}

/**
 * Parse full raw content into structured parts.
 */
export function parseNote(raw: string): ParsedNote {
  const { frontmatter, body } = splitRaw(raw);
  const tags = parseTags(frontmatter);
  return { rawFrontmatter: frontmatter, body, tags };
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

/**
 * Reassemble raw content preserving original frontmatter with updated body.
 * Maintains round-trip idempotency.
 */
export function reassemble(rawFrontmatter: string, body: string): string {
  return `${rawFrontmatter}\n${body}`;
}
