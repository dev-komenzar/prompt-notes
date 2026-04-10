// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 39-3
// @task-title: `created_at` の人間可読形式
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

/**
 * Formats a NoteMetadata.created_at ISO 8601 string into human-readable form.
 * Input: "2026-04-10T09:15:30" (from filename YYYY-MM-DDTHHMMSS.md)
 * Output: "2026-04-10 09:15"
 */
export function formatCreatedAt(createdAt: string): string {
  // createdAt is like "2026-04-10T09:15:30"
  const [datePart, timePart] = createdAt.split('T');
  if (!datePart) return createdAt;
  if (!timePart) return datePart;
  const hhmm = timePart.slice(0, 5); // "09:15"
  return `${datePart} ${hhmm}`;
}
