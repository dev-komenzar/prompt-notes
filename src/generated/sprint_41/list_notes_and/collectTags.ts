// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 41-1
// @task-title: `list_notes` 結果からタグ候補を収集・重複排除。複数選択（AND 条件）。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import type { NoteMetadata } from '$lib/types/note';

/**
 * Collects all unique tags from a list of NoteMetadata, preserving insertion order.
 * Deduplication is case-sensitive to match the AND filter logic in search_notes.
 */
export function collectUniqueTags(notes: NoteMetadata[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const note of notes) {
    for (const tag of note.tags) {
      if (!seen.has(tag)) {
        seen.add(tag);
        result.push(tag);
      }
    }
  }
  return result.sort();
}
