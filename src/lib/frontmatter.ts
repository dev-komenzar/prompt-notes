export function generateFrontmatter(tags: string[] = []): string {
  const tagLine =
    tags.length > 0 ? `tags: [${tags.map((t) => `"${t}"`).join(", ")}]` : "tags: []";
  return `---\n${tagLine}\n---\n`;
}

export function generateNoteContent(
  tags: string[] = [],
  body: string = ""
): string {
  return generateFrontmatter(tags) + "\n" + body;
}

export function extractBody(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return match ? match[1].trimStart() : content;
}

export function detectFrontmatterRange(
  doc: string
): { from: number; to: number } | null {
  if (!doc.startsWith("---\n") && !doc.startsWith("---\r\n")) {
    return null;
  }
  const openLen = doc.startsWith("---\r\n") ? 5 : 4;
  const closeIdx = doc.indexOf("\n---", openLen);
  if (closeIdx === -1) return null;
  const afterClose = closeIdx + 4;
  const to =
    afterClose < doc.length && doc[afterClose] === "\n"
      ? afterClose + 1
      : afterClose < doc.length && doc[afterClose] === "\r"
        ? afterClose + 2
        : afterClose;
  return { from: 0, to };
}

export function parseFrontmatterTags(content: string): string[] {
  const range = detectFrontmatterRange(content);
  if (!range) return [];
  const fm = content.slice(0, range.to);
  const bracketMatch = fm.match(/tags:\s*\[([^\]]*)\]/);
  if (bracketMatch) {
    return bracketMatch[1]
      .split(",")
      .map((t) => t.trim().replace(/^["']|["']$/g, ""))
      .filter((t) => t.length > 0);
  }
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
