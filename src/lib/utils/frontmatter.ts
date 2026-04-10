/**
 * Generate YAML frontmatter string from tags array.
 */
export function generateFrontmatter(tags: string[]): string {
  if (tags.length === 0) {
    return '---\ntags: []\n---\n';
  }
  const tagList = tags.map((t) => `  - ${t}`).join('\n');
  return `---\ntags:\n${tagList}\n---\n`;
}

/**
 * Parse tags from raw note content.
 */
export function parseTags(raw: string): string[] {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return [];

  const yamlBlock = match[1];
  const tags: string[] = [];

  const lines = yamlBlock.split('\n');
  let inTags = false;

  for (const line of lines) {
    if (line.startsWith('tags:')) {
      // Inline array: tags: [a, b, c]
      const inline = line.match(/tags:\s*\[([^\]]*)\]/);
      if (inline) {
        return inline[1]
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }
      inTags = true;
      continue;
    }
    if (inTags) {
      const itemMatch = line.match(/^\s+-\s+(.+)/);
      if (itemMatch) {
        tags.push(itemMatch[1].trim());
      } else {
        break;
      }
    }
  }

  return tags;
}

/**
 * Extract body text from raw content (excluding frontmatter).
 */
export function extractBody(raw: string): string {
  const match = raw.match(/^---\n[\s\S]*?\n---\n?/);
  if (!match) return raw;
  return raw.slice(match[0].length);
}

/**
 * Detect frontmatter range { from, to } in line numbers (0-based).
 */
export function detectFrontmatterRange(doc: string): { from: number; to: number } | null {
  const lines = doc.split('\n');
  if (lines[0] !== '---') return null;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      return { from: 0, to: i };
    }
  }
  return null;
}
