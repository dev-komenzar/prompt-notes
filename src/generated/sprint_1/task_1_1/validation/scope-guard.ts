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

import { PROHIBITED_DOM_SELECTORS } from '../constants/scope-guard';

/**
 * Scope guard runtime checks.
 * These functions verify that prohibited features are not present.
 * Used in E2E tests and optionally in development mode assertions.
 */

/**
 * Checks that no title input field exists in the DOM.
 * FC-ED-02: Title input field is prohibited.
 *
 * @param document - DOM document reference
 * @returns true if no title input is found (compliant)
 */
export function assertNoTitleInput(document: Document): boolean {
  const element = document.querySelector(PROHIBITED_DOM_SELECTORS.TITLE_INPUT);
  return element === null;
}

/**
 * Checks that no rendered Markdown HTML elements exist in the editor content area.
 * FC-ED-02 / NNC-E1: Markdown rendering (HTML generation) is prohibited.
 *
 * @param document - DOM document reference
 * @returns true if no rendered markdown HTML is found (compliant)
 */
export function assertNoMarkdownRendering(document: Document): boolean {
  const selectors = [
    PROHIBITED_DOM_SELECTORS.RENDERED_H1,
    PROHIBITED_DOM_SELECTORS.RENDERED_STRONG,
    PROHIBITED_DOM_SELECTORS.RENDERED_EM,
    PROHIBITED_DOM_SELECTORS.RENDERED_HEADING,
  ];

  for (const selector of selectors) {
    if (document.querySelector(selector) !== null) {
      return false;
    }
  }
  return true;
}

/**
 * Verifies that the editor uses CodeMirror 6 by checking for its characteristic DOM structure.
 * FC-ED-01: Editor must be CodeMirror 6. Monaco, textarea, contenteditable are prohibited.
 *
 * @param document - DOM document reference
 * @returns true if CodeMirror 6 DOM structure is detected
 */
export function assertCodeMirror6Present(document: Document): boolean {
  // CodeMirror 6 renders with .cm-editor container
  const cmEditor = document.querySelector('.cm-editor');
  return cmEditor !== null;
}

/**
 * Verifies that the frontmatter region has a distinct background color.
 * FC-ED-05 / NNC-E1: Frontmatter must be visually distinguished by background color.
 *
 * @param document - DOM document reference
 * @returns true if frontmatter background decoration class is present
 */
export function assertFrontmatterBackgroundPresent(document: Document): boolean {
  const fmBg = document.querySelector('.cm-frontmatter-bg');
  return fmBg !== null;
}

/**
 * Verifies that a copy button exists and is accessible.
 * FC-ED-04 / NNC-E3: 1-click copy button is core UX and mandatory.
 *
 * @param document - DOM document reference
 * @returns true if copy button is found
 */
export function assertCopyButtonPresent(document: Document): boolean {
  const copyBtn = document.querySelector('[aria-label="本文をコピー"], .copy-button, [data-testid="copy-button"]');
  return copyBtn !== null;
}
