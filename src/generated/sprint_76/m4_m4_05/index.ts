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
 * module:grid — Sprint 76 / OQ-GRID-002
 * Tag filter: single vs multi-tag selection.
 *
 * Public API for the tag filter feature module.
 * All IPC filtering is delegated to module:storage (Rust backend).
 * This module provides types, state management, IPC parameter building,
 * tag collection for UI display, and input validation.
 */

// ── Types ──────────────────────────────────────────────────────────
export type {
  TagFilterMode,
  MultiTagCombinator,
  TagFilterConfig,
  TagFilterState,
  TagChangeEvent,
  NoteEntry,
  ListNotesParams,
  SearchNotesParams,
  TagInfo,
} from './types';

// ── Constants ──────────────────────────────────────────────────────
export {
  DEFAULT_TAG_FILTER_MODE,
  DEFAULT_MULTI_TAG_COMBINATOR,
  DEFAULT_TAG_FILTER_CONFIG,
  TAG_DISPLAY_LIMIT,
} from './constants';

// ── State management ───────────────────────────────────────────────
export {
  createTagFilterState,
  toggleTag,
  setSelectedTags,
  clearSelectedTags,
  switchMode,
  setCombinator,
  hasActiveFilter,
  toTagChangeEvent,
} from './tag_filter_state';

// ── IPC parameter building ─────────────────────────────────────────
export {
  buildListNotesParams,
  buildSearchNotesParams,
  requiresMultiTagIpc,
  isMultiTagIpcSupported,
} from './ipc_params_builder';

// ── Tag collection for UI ──────────────────────────────────────────
export {
  collectTags,
  getDisplayTags,
  collectTagNames,
  isTagAvailable,
  pruneStaleSelections,
} from './tag_collector';

// ── Validation ─────────────────────────────────────────────────────
export {
  validateTag,
  validateTags,
  isValidMode,
  isValidCombinator,
  isValidConfig,
  isValidState,
} from './tag_filter_validation';
