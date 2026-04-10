// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: ファイル読み込み → frontmatter
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 15
// @task: 15-1

import type { Frontmatter } from './types';

const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n/;
const TAGS_LINE_REGEX = /^tags:\s*\[([^\]]*)\]\s*$/m;
const TAGS_LIST_REGEX = /^tags:\s*$/m;
const TAG_ITEM_REGEX = /^\s*-\s+(.+)$/gm;

/**
 * Parses YAML frontmatter from raw file content.
 *
 * Supports two YAML tag formats:
 *   1. Inline: `tags: [tag1, tag2]`
 *   2. Block:
 *      ```
 *      tags:
 *        - tag1
 *        - tag2
 *      ```
 *
 * Unknown fields are preserved in `extra` for round-trip fidelity (NNC-S2).
 * If no frontmatter is present, returns empty tags and empty extra.
 */
export function parseFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
  const match = raw.match(FRONTMATTER_REGEX);

  if (!match) {
    return {
      frontmatter: { tags: [], extra: {} },
      body: raw,
    };
  }

  const yamlBlock = match[1];
  const body = raw.slice(match[0].length);
  const tags = extractTags(yamlBlock);
  const extra = extractExtra(yamlBlock);

  return {
    frontmatter: { tags, extra },
    body,
  };
}

function extractTags(yaml: string): string[] {
  // Try inline format: tags: [tag1, tag2]
  const inlineMatch = yaml.match(TAGS_LINE_REGEX);
  if (inlineMatch) {
    const inner = inlineMatch[1].trim();
    if (inner === '') return [];
    return inner.split(',').map((t) => t.trim()).filter(Boolean);
  }

  // Try block format
  const blockMatch = yaml.match(TAGS_LIST_REGEX);
  if (blockMatch) {
    const tags: string[] = [];
    const startIndex = blockMatch.index! + blockMatch[0].length;
    const rest = yaml.slice(startIndex);
    const lines = rest.split('\n');
    for (const line of lines) {
      const itemMatch = line.match(/^\s+-\s+(.+)$/);
      if (itemMatch) {
        tags.push(itemMatch[1].trim());
      } else if (line.trim() !== '' && !line.startsWith(' ') && !line.startsWith('\t')) {
        break;
      }
    }
    return tags;
  }

  return [];
}

function extractExtra(yaml: string): Record<string, unknown> {
  const extra: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Skip tags field (inline or block)
    if (line.match(/^tags:\s*/)) {
      i++;
      // Skip block items belonging to tags
      if (!line.match(/^tags:\s*\[/)) {
        while (i < lines.length && (lines[i].match(/^\s+-/) || lines[i].trim() === '')) {
          i++;
        }
      }
      continue;
    }
    // Capture other top-level keys as raw strings for preservation
    const kvMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1];
      const value = kvMatch[2].trim();
      extra[key] = value || true;
    }
    i++;
  }
  return extra;
}
