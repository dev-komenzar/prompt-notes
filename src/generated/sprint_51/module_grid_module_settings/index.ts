// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 51-1
// @task-title: `module:grid`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:51 | task:51-1 | module:grid, module:settings
// Barrel exports for Sprint 51 deliverable: grid reload after notes_dir change.

export type {
  NoteEntry,
  Config,
  ListNotesParams,
  SearchNotesParams,
  ViewName,
  FilterState,
} from './types';

export {
  listNotes,
  searchNotes,
  deleteNote,
  getConfig,
  setConfig,
} from './ipc-api';

export { debounce, flushableDebounce } from './debounce';

export {
  formatDateParam,
  getDefaultDateRange,
  formatDisplayDate,
  parseDateParam,
} from './date-utils';

export {
  currentView,
  selectedFilename,
  configVersion,
  navigateToGrid,
  navigateToEditor,
  navigateToSettings,
  incrementConfigVersion,
} from './app-store';

export {
  gridNotes,
  gridLoading,
  gridError,
  gridFilters,
  availableTags,
  noteCount,
  resetFilters,
  updateFilterTag,
  updateFilterDates,
  updateFilterQuery,
  clearSearch,
} from './grid-store';

export {
  loadNotes,
  onSearchInput,
  applyTagFilter,
  applyDateFilter,
  clearSearchAndReload,
  handleCardClick,
  refreshGrid,
} from './grid-controller';

export {
  settingsConfig,
  settingsLoading,
  settingsError,
  settingsSaving,
  settingsDirChanged,
} from './settings-store';

export {
  loadConfig,
  updateNotesDir,
  openDirectoryPicker,
  pickAndUpdateNotesDir,
  returnToGrid,
} from './settings-controller';

export {
  initializeGrid,
  subscribeToConfigChanges,
} from './grid-reload-integration';
