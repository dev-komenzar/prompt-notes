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

/**
 * Serializes a Frontmatter object back into a YAML frontmatter string block
 * including the `---` delimiters and trailing newline.
 *
 * Only the `tags` field is auto-managed (NNC-S2).
 * Extra fields are preserved for round-trip fidelity.
 */
export function serializeFrontmatter(fm: Frontmatter): string {
  const lines: string[] = ['---'];

  // Always emit tags field
  if (fm.tags.length === 0) {
    lines.push('tags: []');
  } else {
    lines.push(`tags:`);
    for (const tag of fm.tags) {
      lines.push(`  - ${tag}`);
    }
  }

  // Preserve extra fields
  for (const [key, value] of Object.entries(fm.extra)) {
    if (typeof value === 'string') {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push('---');
  return lines.join('\n') + '\n';
}
