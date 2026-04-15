const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n/;

export function extractBody(rawMarkdown: string): string {
  return rawMarkdown.replace(FRONTMATTER_RE, "");
}

export function extractTags(rawMarkdown: string): string[] {
  const match = rawMarkdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return [];
  const fm = match[1];
  const inline = fm.match(/^tags:\s*\[([^\]]*)\]/m);
  if (inline) {
    return inline[1].split(",").map(t => t.trim()).filter(Boolean);
  }
  const block = fm.match(/^tags:\s*\n((?:\s+-[^\n]*\n?)*)/m);
  if (block) {
    return block[1].split("\n").map(l => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean);
  }
  return [];
}
