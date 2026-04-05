// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 37-1
// @task-title: `module:grid`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:37 task:37-1 module:grid — Public API

// Types
export type {
  NoteEntry,
  ListNotesParams,
  SearchNotesParams,
  GridFilterState,
  GridState,
  MasonryConfig,
  MasonryLayout,
  TagBadge,
  ViewName,
  NavigateToEditorEvent,
  CardClickEvent,
  TagChangeEvent,
  DateChangeEvent,
} from './types';

// Constants
export {
  DEFAULT_FILTER_DAYS,
  SEARCH_DEBOUNCE_MS,
  BODY_PREVIEW_MAX_LENGTH,
  DEFAULT_MASONRY_CONFIG,
  CSS_VARS,
} from './constants';

// Date utilities
export {
  formatDateForIPC,
  getDefaultDateRange,
  formatDisplayDate,
  formatRelativeTime,
  parseFilenameTimestamp,
} from './date-utils';

// Card display utilities
export {
  truncatePreview,
  formatCardTimestamp,
  formatCardTimestampFull,
  buildTagBadges,
  hasVisibleContent,
  cardKey,
} from './card-utils';

// Debounce utility
export { debounce, debounceCancellable } from './debounce';

// Tauri IPC wrappers (sole entry point for data fetching)
export { listNotes, searchNotes, deleteNote } from './ipc';

// Masonry layout engine (OQ-003 resolution: CSS Columns)
export {
  MASONRY_STRATEGY,
  calculateColumnCount,
  createContainerStyles,
  createItemStyles,
  computeMasonryLayout,
  styleMapToString,
  MASONRY_CSS,
  TOOLBAR_CSS,
} from './masonry';

// Resize observer for responsive masonry
export { createMasonryObserver, applyMasonryStyle } from './resize-observer';

// Filter logic
export {
  createDefaultFilterState,
  shouldUseSearchCommand,
  buildListParams,
  buildSearchParams,
  collectAvailableTags,
  isFilterActive,
  withTag,
  withDateRange,
  withSearchQuery,
} from './filters';

// Grid store (Svelte writable)
export { createGridStore, gridStore } from './grid-store';
export type { GridStore } from './grid-store';

// Grid actions (orchestrates IPC + store updates)
export {
  fetchNotes,
  applyTagFilter,
  applyDateFilter,
  createSearchHandler,
  applySearchImmediate,
  clearAllFilters,
  deleteNoteAndRefresh,
  initializeGrid,
} from './grid-actions';

// Navigation helpers
export {
  handleCardClick,
  createNavigateEvent,
  navigateToGrid,
  navigateToSettings,
} from './navigation';
export type { NavigateCallback } from './navigation';
