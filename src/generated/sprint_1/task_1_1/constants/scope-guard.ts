// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 1-1
// @task-title: 完了条件
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/test/acceptance_criteria.md
// @generated-by: codd generate --sprint 1 --task 1-1

/**
 * Scope guard — Explicitly excluded features.
 * Implementation of any listed feature is a release blocker (FC-SC-01..03, FC-ED-02).
 */

/** Features that must NOT exist in the application */
export const PROHIBITED_FEATURES = [
  'ai-invocation',
  'cloud-sync',
  'mobile-support',
  'title-input-field',
  'markdown-preview-rendering',
  'database-storage',
] as const;

export type ProhibitedFeature = typeof PROHIBITED_FEATURES[number];

/** DOM selectors that must NOT match any elements (scope guard assertions) */
export const PROHIBITED_DOM_SELECTORS = {
  /** FC-ED-02: No title input field */
  TITLE_INPUT: 'input[data-role="title"], textarea[data-role="title"], [aria-label="title"]',
  /** FC-ED-02: No rendered markdown HTML in editor body */
  RENDERED_H1: '.cm-content h1',
  RENDERED_STRONG: '.cm-content strong',
  RENDERED_EM: '.cm-content em',
  RENDERED_HEADING: '.cm-content h2, .cm-content h3, .cm-content h4, .cm-content h5, .cm-content h6',
} as const;

/** Network patterns that must NOT appear (FC-SC-01, FC-SC-02) */
export const PROHIBITED_NETWORK_PATTERNS = {
  /** No external API calls */
  EXTERNAL_FETCH: 'fetch',
  EXTERNAL_XHR: 'XMLHttpRequest',
} as const;

/** Editor engine constraint — FC-ED-01 */
export const REQUIRED_EDITOR_ENGINE = 'codemirror-6' as const;

/** Framework constraint — Tauri only, no Electron */
export const REQUIRED_FRAMEWORK = 'tauri-v2' as const;
