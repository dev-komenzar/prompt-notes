// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 76-1
// @task-title: M4（M4-05）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

/**
 * Builds IPC command parameters from TagFilterState.
 *
 * module:grid — OQ-GRID-002
 *
 * CONV-IPC compliance: all parameters are sent to module:storage (Rust)
 * via lib/api.ts → Tauri IPC. No client-side filtering is performed.
 *
 * Backward compatibility:
 *   - 'single' mode populates `tag?: string` (existing IPC contract).
 *   - 'multi' mode populates `tags?: string[]` and `tags_combinator`.
 *     This requires the Rust-side IPC handler to be extended.
 *     Until the Rust side is updated, multi-mode falls back to single
 *     by sending the first selected tag in `tag`.
 */

import type {
  TagFilterState,
  ListNotesParams,
  SearchNotesParams,
} from './types';

/**
 * Whether the Rust backend supports the extended multi-tag IPC.
 * Flip to `true` once module:storage accepts `tags` and `tags_combinator`.
 */
const MULTI_TAG_IPC_SUPPORTED = false;

interface DateRange {
  readonly from_date?: string;
  readonly to_date?: string;
}

/**
 * Builds tag-related IPC parameters from the current filter state.
 * Returns a partial object to be spread into ListNotesParams or SearchNotesParams.
 */
function buildTagParams(
  state: TagFilterState,
): Pick<ListNotesParams, 'tag' | 'tags' | 'tags_combinator'> {
  if (state.selectedTags.length === 0) {
    return {};
  }

  if (state.config.mode === 'single') {
    return { tag: state.selectedTags[0] };
  }

  // Multi mode
  if (MULTI_TAG_IPC_SUPPORTED) {
    return {
      tags: [...state.selectedTags],
      tags_combinator: state.config.combinator,
    };
  }

  // Fallback: Rust side does not yet support multi-tag.
  // Send first selected tag via existing `tag` param.
  // This is a graceful degradation; the UI may show multiple
  // tags selected but the backend filters by the first only.
  return { tag: state.selectedTags[0] };
}

/**
 * Constructs parameters for the `list_notes` IPC command.
 */
export function buildListNotesParams(
  state: TagFilterState,
  dateRange: DateRange,
): ListNotesParams {
  return {
    ...dateRange,
    ...buildTagParams(state),
  };
}

/**
 * Constructs parameters for the `search_notes` IPC command.
 */
export function buildSearchNotesParams(
  state: TagFilterState,
  query: string,
  dateRange: DateRange,
): SearchNotesParams {
  return {
    query,
    ...dateRange,
    ...buildTagParams(state),
  };
}

/**
 * Returns true if the current tag filter state requires the extended
 * multi-tag IPC that is not yet supported by the Rust backend.
 * UI can use this to show a warning or degrade gracefully.
 */
export function requiresMultiTagIpc(state: TagFilterState): boolean {
  return (
    state.config.mode === 'multi' &&
    state.selectedTags.length > 1 &&
    !MULTI_TAG_IPC_SUPPORTED
  );
}

/**
 * Returns true when the extended multi-tag IPC is available.
 */
export function isMultiTagIpcSupported(): boolean {
  return MULTI_TAG_IPC_SUPPORTED;
}
