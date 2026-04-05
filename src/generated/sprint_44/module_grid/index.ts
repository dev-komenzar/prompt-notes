// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 44-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// trace: sprint_44 / task 44-1 / module:grid
// Public API surface of module:grid.
// Svelte components (GridView.svelte, NoteCard.svelte, TagFilter.svelte,
// DateFilter.svelte) import from this barrel to avoid deep paths.

// ── Types ────────────────────────────────────────────────────────────
export type {
  NoteEntry,
  ListNotesParams,
  SearchNotesParams,
  DeleteNoteParams,
  FilterCriteria,
  GridViewState,
  LoadingStatus,
  GridSnapshot,
  CardClickEvent,
  TagChangeEvent,
  DateChangeEvent,
  AppView,
} from './types';

export type { CardViewModel } from './card_helpers';
export type { MasonryContainerStyle } from './masonry';
export type { SnapshotListener } from './grid_controller';
export type { Debounced } from './debounce';
export type { ResolvedQuery } from './filter_state';

// ── Controller ───────────────────────────────────────────────────────
export { GridController } from './grid_controller';

// ── Filter state helpers ─────────────────────────────────────────────
export {
  createDefaultFilterCriteria,
  resolveQuery,
  deriveViewState,
  applyTagChange,
  applyDateChange,
  applyQueryChange,
  clearSearch,
  resetFilters,
} from './filter_state';

// ── API (IPC wrappers) ──────────────────────────────────────────────
export { listNotes, searchNotes, deleteNote } from './api';

// ── Utilities ────────────────────────────────────────────────────────
export { debounce } from './debounce';
export { collectUniqueTags } from './tag_collector';
export { toCardViewModel, toCardViewModels } from './card_helpers';
export {
  formatDateParam,
  getDefault7DayRange,
  formatCreatedAtDisplay,
  isValidDateParam,
} from './date_utils';
export {
  getMasonryContainerStyle,
  getMasonryContainerCss,
  getMasonryItemCss,
} from './masonry';

// ── Constants ────────────────────────────────────────────────────────
export {
  DEFAULT_FILTER_DAYS,
  SEARCH_DEBOUNCE_MS,
  BODY_PREVIEW_MAX_CHARS,
  MASONRY_COLUMN_MIN_WIDTH_PX,
  MASONRY_MAX_COLUMNS,
  MASONRY_COLUMN_GAP_PX,
} from './constants';
