// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd generate --sprint 1 --task 1-1

import { FRONTMATTER_REGEX, ALLOWED_FRONTMATTER_FIELDS } from '../constants/conventions';
import type { Frontmatter } from '../types/note';

/**
 * Extracts the body text from a full document, stripping the YAML frontmatter.
 * Used by CopyButton (NNC-E3) to copy body only (excluding frontmatter).
 *
 * @param doc - Full document text including frontmatter
 * @returns Body text without frontmatter
 */
export function extractBody(doc: string): string {
  const match = doc.match(FRONTMATTER_REGEX);
  return match ? doc.slice(match[0].length) : doc;
}

/**
 * Extracts frontmatter YAML string from a full document.
 *
 * @param doc - Full document text
 * @returns Raw YAML string (without delimiters), or null if no frontmatter
 */
export function extractFrontmatterYaml(doc: string): string | null {
  if (!doc.startsWith('---\n')) {
    return null;
  }
  const endIndex = doc.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return null;
  }
  return doc.slice(4, endIndex);
}

/**
 * Parses tags from a raw YAML frontmatter string.
 * NNC-S2: Only 'tags' field is recognized.
 *
 * @param yaml - Raw YAML content between --- delimiters
 * @returns Array of tag strings
 */
export function parseTagsFromYaml(yaml: string): string[] {
  // Handle flow style: tags: [tag1, tag2]
  const flowMatch = yaml.match(/^tags:\s*\[([^\]]*)\]/m);
  if (flowMatch) {
    return flowMatch[1]
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  // Handle block style:
  // tags:
  //   - tag1
  //   - tag2
  const lines = yaml.split('\n');
  const tagsIdx = lines.findIndex((l) => /^tags:\s*$/.test(l));
  if (tagsIdx === -1) {
    return [];
  }

  const tags: string[] = [];
  for (let i = tagsIdx + 1; i < lines.length; i++) {
    const itemMatch = lines[i].match(/^\s+-\s+(.+)$/);
    if (itemMatch) {
      tags.push(itemMatch[1].trim());
    } else {
      break;
    }
  }
  return tags;
}

/**
 * Serializes a Frontmatter object to YAML frontmatter block string.
 * NNC-S2: Only 'tags' field is serialized.
 *
 * @param frontmatter - Frontmatter data
 * @returns Complete frontmatter block including --- delimiters and trailing newline
 */
export function serializeFrontmatter(frontmatter: Frontmatter): string {
  if (frontmatter.tags.length === 0) {
    return '---\ntags: []\n---\n';
  }
  const tagList = frontmatter.tags.map((t) => JSON.stringify(t)).join(', ');
  return `---\ntags: [${tagList}]\n---\n`;
}

/**
 * Validates that a frontmatter object only contains allowed fields.
 * NNC-S2 / FC-ST-03: No auto-inserted fields other than 'tags'.
 *
 * @param obj - Parsed frontmatter object
 * @returns true if only allowed fields are present
 */
export function validateFrontmatterSchema(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj);
  return keys.every((key) => (ALLOWED_FRONTMATTER_FIELDS as readonly string[]).includes(key));
}
