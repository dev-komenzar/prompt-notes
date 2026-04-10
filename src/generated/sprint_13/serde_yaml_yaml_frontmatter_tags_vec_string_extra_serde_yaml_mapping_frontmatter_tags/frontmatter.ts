// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `serde_yaml` による YAML 解析。`Frontmatter` 構造体（`tags: Vec<String>`, `extra: serde_yaml::Mapping`）でラウンドトリップ保全。frontmatter 不在時は `tags: []` として扱う。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 13
// @task: 13-1
// Frontmatter parse/serialize with round-trip preservation of unknown fields.
// Mirrors Rust struct: Frontmatter { tags: Vec<String>, extra: serde_yaml::Mapping }

import { parseYaml, stringifyYaml } from './yaml-utils';

export interface Frontmatter {
  readonly tags: string[];
  readonly extra: Record<string, unknown>;
}

const FRONTMATTER_OPEN = '---';
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n?/;

export function createEmptyFrontmatter(): Frontmatter {
  return { tags: [], extra: {} };
}

/**
 * Split raw markdown content into frontmatter YAML string and body.
 * Returns null yaml when frontmatter is absent.
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
 * Parse frontmatter from raw file content.
 * When frontmatter is absent, returns tags: [] with empty extra.
 * Unknown fields are preserved in `extra` for round-trip fidelity.
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
 * Serialize Frontmatter back to a full markdown string (frontmatter + body).
 * Preserves unknown fields stored in `extra`.
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

  return `---\n${trimmed}\n---\n${body}`;
}

function normalizeTags(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string');
  }
  return [];
}
