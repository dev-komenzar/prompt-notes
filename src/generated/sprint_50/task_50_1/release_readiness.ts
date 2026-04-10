// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 50-1
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
// @generated-by: codd implement --sprint 50

/**
 * Release readiness checklist for PromptNotes.
 *
 * This module provides a machine-readable enumeration of all release-blocking
 * acceptance criteria and failure guards as defined in
 * docs/test/acceptance_criteria.md and the Non-negotiable conventions.
 *
 * Import and use in CI scripts to assert that every criterion is covered by
 * at least one Playwright test result.
 */

export type CriterionStatus = 'required' | 'optional';

export interface ReleaseCriterion {
  id: string;
  module: string;
  description: string;
  status: CriterionStatus;
  testFile: string;
  testName: string;
}

/**
 * Acceptance criteria that MUST pass for release.
 * Any FAIL in this list blocks the CI pipeline.
 */
export const RELEASE_BLOCKING_CRITERIA: ReleaseCriterion[] = [
  // module:editor
  {
    id: 'AC-ED-01',
    module: 'editor',
    description: 'CodeMirror 6 with Markdown syntax highlight, no HTML rendering',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-ED-01: CodeMirror 6 renders Markdown highlight classes without HTML elements',
  },
  {
    id: 'AC-ED-02',
    module: 'editor',
    description: 'No title input field on editor page',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-ED-02: No title-dedicated input or textarea exists on editor page',
  },
  {
    id: 'AC-ED-03',
    module: 'editor',
    description: 'Frontmatter region visually distinguished by background color',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-ED-03: Frontmatter region has background-color distinct from body',
  },
  {
    id: 'AC-ED-04',
    module: 'editor',
    description: 'Cmd+N / Ctrl+N creates new note and focuses editor',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-ED-04: Cmd+N / Ctrl+N creates new note and moves focus to editor',
  },
  {
    id: 'AC-ED-05',
    module: 'editor',
    description: '1-click copy button copies body (excluding frontmatter)',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-ED-05: Copy button copies body content excluding frontmatter',
  },
  {
    id: 'AC-ED-06',
    module: 'editor',
    description: 'Auto-save persists without explicit user action',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-ED-06: Content is auto-saved without explicit user save action',
  },
  // module:storage
  {
    id: 'AC-ST-01',
    module: 'storage',
    description: 'Filename follows YYYY-MM-DDTHHMMSS.md format',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-ST-01: New note filename matches YYYY-MM-DDTHHMMSS.md format',
  },
  {
    id: 'AC-ST-02',
    module: 'storage',
    description: 'File has valid YAML frontmatter with tags-only schema',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-ST-02: Saved file has valid YAML frontmatter with tags field only',
  },
  {
    id: 'AC-ST-03',
    module: 'storage',
    description: 'Default save directory is OS-appropriate',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-ST-03: Default save directory matches OS-specific path',
  },
  {
    id: 'AC-ST-04',
    module: 'storage',
    description: 'Save directory can be changed via settings',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-ST-04: Save directory can be changed via settings',
  },
  // module:grid
  {
    id: 'AC-GR-01',
    module: 'grid',
    description: 'Pinterest-style masonry layout',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-GR-01: Grid view renders masonry (multi-column variable-height) layout',
  },
  {
    id: 'AC-GR-02',
    module: 'grid',
    description: 'Default filter shows only last 7 days',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-GR-02: Default filter shows only notes from last 7 days',
  },
  {
    id: 'AC-GR-03',
    module: 'grid',
    description: 'Tag and date filter narrow visible cards',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-GR-03: Tag filter and date filter narrow visible cards',
  },
  {
    id: 'AC-GR-04',
    module: 'grid',
    description: 'Full-text search filters notes by body content',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-GR-04: Full-text search returns only matching notes',
  },
  {
    id: 'AC-GR-05',
    module: 'grid',
    description: 'Card click navigates to editor with correct note',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-GR-05: Clicking a card navigates to /edit/:filename',
  },
  // module:settings
  {
    id: 'AC-CF-01',
    module: 'settings',
    description: 'Settings screen persists directory change',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'AC-CF-01: Save directory setting persists after change',
  },
];

/**
 * Failure criteria guards — each verifies a prohibited state does NOT exist.
 */
export const FAILURE_GUARDS: ReleaseCriterion[] = [
  {
    id: 'FC-ED-01',
    module: 'editor',
    description: 'No non-CodeMirror editor engine (Monaco, raw textarea)',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'FC-ED-01 guard: CodeMirror 6 is the editor engine (no Monaco, textarea, contenteditable)',
  },
  {
    id: 'FC-ED-02',
    module: 'editor',
    description: 'No title input, no Markdown rendered HTML',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'FC-ED-02 guard: No title field, no Markdown rendered HTML in editor',
  },
  {
    id: 'FC-ED-03',
    module: 'editor',
    description: 'Cmd+N / Ctrl+N is functional',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'FC-ED-03 guard: Cmd+N / Ctrl+N creates new note (not broken)',
  },
  {
    id: 'FC-ED-04',
    module: 'editor',
    description: 'Copy button present on editor page',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'FC-ED-04 guard: Copy button is present on editor page',
  },
  {
    id: 'FC-ST-01',
    module: 'storage',
    description: 'Filename format is YYYY-MM-DDTHHMMSS.md',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'FC-ST-01 guard: Filename format is YYYY-MM-DDTHHMMSS.md',
  },
  {
    id: 'FC-ST-03',
    module: 'storage',
    description: 'No extra frontmatter fields auto-inserted',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'FC-ST-03 guard: Auto-saved frontmatter contains only tags field',
  },
  {
    id: 'FC-GR-01',
    module: 'grid',
    description: 'Grid default is not all-time (must be 7-day)',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'FC-GR-01 guard: Grid default does not show all-time notes',
  },
  {
    id: 'FC-SC-01',
    module: 'scope-guard',
    description: 'No external AI API calls',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'FC-SC-01 guard: No external AI API calls made during normal usage',
  },
  {
    id: 'FC-SC-02',
    module: 'scope-guard',
    description: 'No cloud sync or external network requests',
    status: 'required',
    testFile: 'acceptance_criteria_e2e.spec.ts',
    testName: 'FC-SC-02 guard: No cloud sync or fetch to external servers',
  },
];

/**
 * All release-blocking test IDs in a flat list, for use in CI quality gate scripts.
 */
export const RELEASE_GATE_TEST_IDS: string[] = [
  ...RELEASE_BLOCKING_CRITERIA.map((c) => c.id),
  ...FAILURE_GUARDS.map((c) => c.id),
];

/**
 * Returns true when all provided test result IDs are present in the passing set.
 * Use in CI to enforce the quality gate.
 */
export function assertReleaseReadiness(passingTestIds: string[]): {
  ready: boolean;
  failing: string[];
} {
  const failing = RELEASE_GATE_TEST_IDS.filter((id) => !passingTestIds.includes(id));
  return {
    ready: failing.length === 0,
    failing,
  };
}
