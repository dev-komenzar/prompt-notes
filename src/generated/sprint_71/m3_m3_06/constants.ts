// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 71-1
// @task-title: M3（M3-06）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=71 task=71-1 module=m3_m3_06
// @codd:trace detail:editor_clipboard OQ-E01

/**
 * Feedback display duration in milliseconds.
 * Design baseline: 1.5s (OQ-E01 resolution).
 */
export const FEEDBACK_DURATION_MS = 1500;

/**
 * Fallback copy method timeout in milliseconds.
 * Used when navigator.clipboard.writeText is unavailable.
 */
export const FALLBACK_COPY_TIMEOUT_MS = 100;

/**
 * ARIA label for the copy button (Japanese locale).
 * Per detail:editor_clipboard §4.3 accessibility requirement.
 */
export const COPY_BUTTON_ARIA_LABEL = '本文をクリップボードにコピー';

/**
 * Feedback tooltip text shown after successful copy.
 */
export const FEEDBACK_TOOLTIP_TEXT = 'コピーしました';

/**
 * Icon identifiers used by the CopyButton feedback states.
 */
export const ICON_CLIPBOARD = 'clipboard' as const;
export const ICON_CHECK = 'check' as const;
