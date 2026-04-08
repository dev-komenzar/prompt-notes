// Sprint 5/17/66 – YAML frontmatter utilities
// Template generation, body extraction, range detection for CM6 decoration

/**
 * Generate YAML frontmatter block for a new note.
 * Only `tags` field is supported per design spec.
 */
export function generateFrontmatter(tags: string[] = []): string {
  const tagLine =
    tags.length > 0 ? `tags: [${tags.map((t) => `"${t}"`).join(", ")}]` : "tags: []";
  return `---\n${tagLine}\n---\n`;
}

/**
 * Generate a complete new note with frontmatter and optional body.
 */
export function generateNoteContent(
  tags: string[] = [],
  body: string = ""
): string {
  return generateFrontmatter(tags) + "\n" + body;
}

/**
 * Extract the body text (everything after the closing ---).
 * Returns the full content if no valid frontmatter is found.
 */
export function extractBody(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return match ? match[1].trimStart() : content;
}

/**
 * Detect the character range of the frontmatter block (including delimiters).
 * Returns null if no valid frontmatter is found.
 * Used by CM6 StateField decoration to apply background styling.
 */
export function detectFrontmatterRange(
  doc: string
): { from: number; to: number } | null {
  if (!doc.startsWith("---\n") && !doc.startsWith("---\r\n")) {
    return null;
  }
  // Find the closing ---
  const openLen = doc.startsWith("---\r\n") ? 5 : 4;
  const closeIdx = doc.indexOf("\n---", openLen);
  if (closeIdx === -1) return null;
  // to = position after the closing --- line (including its newline)
  const afterClose = closeIdx + 4; // "\n---".length
  const to =
    afterClose < doc.length && doc[afterClose] === "\n"
      ? afterClose + 1
      : afterClose < doc.length && doc[afterClose] === "\r"
        ? afterClose + 2
        : afterClose;
  return { from: 0, to };
}

/**
 * Parse tags from a frontmatter string.
 */
export function parseFrontmatterTags(content: string): string[] {
  const range = detectFrontmatterRange(content);
  if (!range) return [];
  const fm = content.slice(0, range.to);
  // Match tags: [...]  or tags:\n - item format
  const bracketMatch = fm.match(/tags:\s*\[([^\]]*)\]/);
  if (bracketMatch) {
    return bracketMatch[1]
      .split(",")
      .map((t) => t.trim().replace(/^["']|["']$/g, ""))
      .filter((t) => t.length > 0);
  }
  // YAML list format
  const tags: string[] = [];
  const listRegex = /tags:\s*\n((?:\s*-\s*.+\n?)*)/;
  const listMatch = fm.match(listRegex);
  if (listMatch) {
    const items = listMatch[1].matchAll(/^\s*-\s*(.+)$/gm);
    for (const item of items) {
      tags.push(item[1].trim().replace(/^["']|["']$/g, ""));
    }
  }
  return tags;
}
