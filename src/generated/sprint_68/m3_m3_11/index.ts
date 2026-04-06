// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 68-1
// @task-title: M3（M3-11）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=68, task=68-1, module=module:editor, oq=OQ-004
// Public API barrel export for auto-save debounce module.

export type {
  AutoSaveConfig,
  AutoSaveMetric,
  AutoSaveSessionMetrics,
  DebouncePreset,
  GetContentFn,
  SaveNoteFn,
} from './types';
export { AutoSaveState } from './types';

export {
  DEFAULT_AUTOSAVE_CONFIG,
  DEBOUNCE_PRESETS,
  createAutoSaveConfig,
} from './autosave-config';

export { debounce, type DebouncedFn } from './debounce';

export {
  AutoSaveMetricsCollector,
  SaveCycleTracker,
} from './autosave-metrics';

export { AutoSaveManager } from './autosave-manager';

export {
  createAutoSaveExtension,
  type AutoSaveExtensionOptions,
  type AutoSaveExtensionResult,
} from './codemirror-autosave-extension';
