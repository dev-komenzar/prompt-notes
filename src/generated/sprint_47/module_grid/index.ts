// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 47-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:47 task:47-1 module:grid
// Barrel exports for module:grid.

// ── Types ──
export type {
  NoteEntry,
  ListNotesParams,
  SearchNotesParams,
  GridFilterState,
  GridViewState,
  ViewName,
  CardClickEvent,
} from './types';

// ── Constants (OQ-GRID-001 resolved) ──
export {
  SEARCH_DEBOUNCE_MS,
  DEFAULT_FILTER_DAYS,
  BODY_PREVIEW_MAX_CHARS,
  MASONRY_COLUMN_MIN_WIDTH_PX,
  MASONRY_GAP_PX,
} from './constants';

// ── Utilities ──
export { debounce, type DebouncedFn } from './debounce';
export {
  formatDateParam,
  getDefaultDateRange,
  formatDisplayDate,
  parseDateFromFilename,
} from './date_utils';
export { collectUniqueTags } from './tag_collector';
export { masonryContainerStyle, MASONRY_CSS } from './masonry';

// ── IPC (all grid data operations route through here) ──
export { listNotes, searchNotes, deleteNote } from './ipc';

// ── State & Controller ──
export { createGridStores, type GridStores } from './grid_state';
export {
  createGridController,
  type GridController,
  type OnNavigate,
} from './grid_controller';
