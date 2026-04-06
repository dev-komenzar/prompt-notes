// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 75-1
// @task-title: M4（M4-11）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint_75 / task 75-1 / M4-11 / OQ-GRID-001
// Search debounce interval resolved at 300ms per grid_search_design §4.2
// Auto-save debounce remains at 500ms per editor_clipboard_design §4.5

export const SEARCH_DEBOUNCE_MS = 300 as const;

export const AUTOSAVE_DEBOUNCE_MS = 500 as const;

export const DEFAULT_FILTER_DAYS = 7 as const;

export const BODY_PREVIEW_MAX_LENGTH = 200 as const;
