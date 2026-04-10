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

/**
 * TagFilter logic layer for src/lib/components/grid/TagFilter.svelte.
 *
 * Responsibilities:
 *   1. Expose available tag candidates collected from list_notes results (deduplicated).
 *   2. Manage multi-selection state.
 *   3. Emit the AND-condition tags[] array for use as the `tags` parameter of
 *      search_notes / list_notes IPC calls.
 *
 * Usage in TagFilter.svelte:
 *
 *   import { availableTags, selectedTags, toggleTag, clearSelectedTags,
 *            refreshAvailableTags } from './TagFilter';
 *
 *   // After receiving notes from list_notes / search_notes:
 *   refreshAvailableTags(notes);
 *
 *   // Render a chip/checkbox per available tag, call toggleTag(tag) on click.
 *   // Pass $selectedTags as `tags` to the next search_notes call.
 */
export {
  collectUniqueTags,
} from './collectTags';

export {
  availableTags,
  selectedTags,
  andFilterTags,
  refreshAvailableTags,
  toggleTag,
  clearSelectedTags,
  isTagSelected,
} from './tagFilterStore';
