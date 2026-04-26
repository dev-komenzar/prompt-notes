/**
 * Frontmatter stub — standalone parsing/serialization for tests.
 * This mirrors the production frontmatter module but provides full
 * parse/serialize capabilities for test assertions.
 */
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

// ─── Types ───────────────────────────────────────────────────

export interface Frontmatter {
  readonly tags: string[];
  readonly extra: Record<string, unknown>;
}

// ─── Constants ───────────────────────────────────────────────

export const FRONTMATTER_OPEN = '---';

export const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n\n?/;

// ─── Helpers ─────────────────────────────────────────────────

export function createEmptyFrontmatter(): Frontmatter {
  return { tags: [], extra: {} };
}

// ─── Core Functions ──────────────────────────────────────────

/**
 * Split raw note content into YAML string and body.
 * Returns `{ yaml: null, body: content }` if no frontmatter is detected.
 */
export function splitRaw(content: string): { yaml: string | null; body: string } {
  if (!content.startsWith(FRONTMATTER_OPEN + '\n')) {
    return { yaml: null, body: content };
  }
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) {
    return { yaml: null, body: content };
  }
  const yamlStr = match[1];
  const body = content.slice(match[0].length);
  return { yaml: yamlStr, body };
}

/**
 * Parse raw note content into structured Frontmatter + body.
 */
export function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const { yaml, body } = splitRaw(content);

  if (yaml === null) {
    return { frontmatter: createEmptyFrontmatter(), body };
  }

  const parsed = parseYaml(yaml);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { frontmatter: createEmptyFrontmatter(), body };
  }

  const mapping = parsed as Record<string, unknown>;
  const rawTags = mapping['tags'];
  const tags = normalizeTags(rawTags);

  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(mapping)) {
    if (key !== 'tags') {
      extra[key] = value;
    }
  }

  return { frontmatter: { tags, extra }, body };
}

/**
 * Serialize Frontmatter + body back into raw note content.
 * ADR-008 compliant: closing fence `---\n` + separator `\n` before body.
 */
export function serializeFrontmatter(frontmatter: Frontmatter, body: string): string {
  const mapping: Record<string, unknown> = {};

  mapping['tags'] = frontmatter.tags;

  for (const [key, value] of Object.entries(frontmatter.extra)) {
    if (key !== 'tags') {
      mapping[key] = value;
    }
  }

  const yamlStr = stringifyYaml(mapping);
  const trimmed = yamlStr.endsWith('\n') ? yamlStr.slice(0, -1) : yamlStr;

  // ADR-008: 閉じフェンス後に separator `\n` を 1 つ置いた上で body を続ける
  return `---\n${trimmed}\n---\n\n${body}`;
}

// ─── Internal ────────────────────────────────────────────────

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string');
  }
  return [];
}
