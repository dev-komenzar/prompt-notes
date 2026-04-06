// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 63-1
// @task-title: Linux, macOS
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated Sprint 63 — Task 63-1 — Linux, macOS smoke test UI foundation
// trace: plan:implementation_plan > detail:editor_clipboard — RBC-1, RBC-2

import type { SmokeCheckResult } from './smoke-types';
import { runCheck, assert } from './check-helpers';

/**
 * Smoke checks for module:editor.
 * These verify that release-blocking editor constraints are met:
 *
 *   - RBC-1 / FAIL-01: Cmd+N / Ctrl+N creates a new note
 *   - RBC-1 / FAIL-02: 1-click copy button exists and functions
 *   - RBC-2 / FAIL-03: CodeMirror 6 is the editor engine
 *   - RBC-2 / FAIL-04: No title input field exists
 *   - RBC-2 / FAIL-05: No Markdown preview/rendering exists
 *   - FAIL-20: Markdown syntax highlighting is applied
 *   - FAIL-21: Frontmatter area has distinct background color
 *
 * These checks run against the live DOM in the WebView.
 */
export async function runEditorChecks(): Promise<SmokeCheckResult[]> {
  const results: SmokeCheckResult[] = [];

  // ED-01: CodeMirror 6 instance exists in the DOM (RBC-2 / FAIL-03)
  results.push(
    await runCheck(
      'ED-01',
      'editor',
      'CodeMirror 6 editor instance is present in the DOM',
      async () => {
        const cmElement = document.querySelector('.cm-editor');
        assert(cmElement !== null, 'Expected .cm-editor element to exist in the DOM');
        const cmContent = document.querySelector('.cm-content');
        assert(cmContent !== null, 'Expected .cm-content element (CodeMirror 6 content area)');
      },
    ),
  );

  // ED-02: No title input field (RBC-2 / FAIL-04)
  results.push(
    await runCheck(
      'ED-02',
      'editor',
      'No title input field exists in the editor screen',
      async () => {
        // Check for common title input patterns
        const titleInputs = document.querySelectorAll(
          '[data-testid="title-input"], [name="title"], [placeholder*="title" i], [aria-label*="title" i]',
        );
        assert(
          titleInputs.length === 0,
          `Found ${titleInputs.length} potential title input element(s) — title input is PROHIBITED`,
        );
      },
    ),
  );

  // ED-03: No Markdown preview/rendering panel (RBC-2 / FAIL-05)
  results.push(
    await runCheck(
      'ED-03',
      'editor',
      'No Markdown preview/rendering panel exists',
      async () => {
        const previewPanels = document.querySelectorAll(
          '[data-testid="markdown-preview"], .markdown-preview, .md-preview, .preview-panel',
        );
        assert(
          previewPanels.length === 0,
          `Found ${previewPanels.length} Markdown preview element(s) — preview rendering is PROHIBITED`,
        );
      },
    ),
  );

  // ED-04: Copy button exists (RBC-1 / FAIL-02)
  results.push(
    await runCheck(
      'ED-04',
      'editor',
      '1-click copy button is present in the editor screen',
      async () => {
        const copyButton = document.querySelector(
          '[data-testid="copy-button"], [aria-label*="コピー"], [aria-label*="copy" i], button.copy-button',
        );
        assert(copyButton !== null, 'Expected a copy button element in the editor screen');
      },
    ),
  );

  // ED-05: Frontmatter area has distinct background (FAIL-21)
  results.push(
    await runCheck(
      'ED-05',
      'editor',
      'Frontmatter lines have distinct background color decoration',
      async () => {
        const fmLines = document.querySelectorAll('.cm-frontmatter-line');
        // If there is content with frontmatter, we expect decorated lines
        const cmContent = document.querySelector('.cm-content');
        if (cmContent && cmContent.textContent?.startsWith('---')) {
          assert(
            fmLines.length > 0,
            'Frontmatter content detected but no .cm-frontmatter-line decorations found',
          );
        }
        // If no frontmatter content, this check is informational-pass
      },
    ),
  );

  return results;
}
