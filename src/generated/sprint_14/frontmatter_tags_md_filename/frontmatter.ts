// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 14-1
// @task-title: ファイル名生成 → frontmatter テンプレート（空 `tags`）付き `.md` ファイル作成 → `{filename}` 返却
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 14
// @task: 14-1

import type { Frontmatter } from './types';

/**
 * Generates a YAML frontmatter string from a Frontmatter object.
 * Per NNC-S2, only `tags` field is allowed.
 */
export function serializeFrontmatter(fm: Frontmatter): string {
  const tagsYaml =
    fm.tags.length === 0
      ? 'tags: []'
      : `tags:\n${fm.tags.map((t) => `  - ${t}`).join('\n')}`;
  return `---\n${tagsYaml}\n---`;
}

/**
 * Creates an empty frontmatter template with no tags.
 * Used when creating a new note via `create_note`.
 */
export function createEmptyFrontmatter(): Frontmatter {
  return { tags: [] };
}

/**
 * Generates the full content for a new empty note file:
 * frontmatter template with empty tags followed by a blank body.
 */
export function createEmptyNoteContent(): string {
  const fm = createEmptyFrontmatter();
  return `${serializeFrontmatter(fm)}\n\n`;
}

/**
 * Parses raw markdown text into frontmatter and body parts.
 * The frontmatter block is delimited by `---` at the start of the document.
 *
 * @returns Object with parsed frontmatter (tags) and body text.
 */
export function parseFrontmatterAndBody(content: string): {
  frontmatter: Frontmatter;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: { tags: [] }, body: content };
  }

  const yamlBlock = match[1];
  const body = match[2];

  const tags = parseTagsFromYaml(yamlBlock);

  return { frontmatter: { tags }, body };
}

/**
 * Extracts tags array from a raw YAML string.
 * Supports both flow style `tags: [a, b]` and block style:
 * ```
 * tags:
 *   - a
 *   - b
 * ```
 */
function parseTagsFromYaml(yaml: string): string[] {
  // Flow style: tags: [a, b, c]
  const flowMatch = yaml.match(/tags:\s*\[([^\]]*)\]/);
  if (flowMatch) {
    const inner = flowMatch[1].trim();
    if (inner === '') return [];
    return inner.split(',').map((t) => t.trim()).filter(Boolean);
  }

  // Block style: tags:\n  - a\n  - b
  const blockMatch = yaml.match(/tags:\s*\n((?:\s+-\s+.*\n?)*)/);
  if (blockMatch) {
    const lines = blockMatch[1].trim().split('\n');
    return lines
      .map((line) => line.replace(/^\s*-\s*/, '').trim())
      .filter(Boolean);
  }

  // tags key exists but empty
  if (/tags:\s*$/.test(yaml)) {
    return [];
  }

  return [];
}

/**
 * Extracts only the body text (excluding frontmatter) from full note content.
 * Used by the copy button to copy body without frontmatter.
 */
export function extractBody(content: string): string {
  const match = content.match(/^---\n[\s\S]*?\n---\n?/);
  return match ? content.slice(match[0].length) : content;
}
