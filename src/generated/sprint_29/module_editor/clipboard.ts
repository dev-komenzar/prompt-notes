// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 29-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:29 task:29-1 module:editor
// CoDD trace: detail:editor_clipboard §4.3, test:acceptance_criteria AC-ED-05
// CONV-7: 1-click copy button is a release-blocking core UX feature.
// Copy target: body text excluding frontmatter (AC-ED-05).
// Clipboard API runs inside WebView (Secure Context) — no IPC required.

import { extractBodyText } from './frontmatter-utils';

/**
 * Copies the body text (frontmatter excluded) to the system clipboard.
 * Falls back to `document.execCommand('copy')` when the Clipboard API
 * is unavailable.
 *
 * @returns `true` if the copy succeeded.
 */
export async function copyBodyToClipboard(fullDocumentText: string): Promise<boolean> {
  const body = extractBodyText(fullDocumentText);
  return writeToClipboard(body);
}

/**
 * Writes arbitrary text to the system clipboard with a legacy fallback.
 */
export async function writeToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy fallback
    }
  }
  return fallbackCopy(text);
}

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  Object.assign(textarea.style, {
    position: 'fixed',
    left: '-9999px',
    top: '-9999px',
    opacity: '0',
  } satisfies Partial<CSSStyleDeclaration>);

  document.body.appendChild(textarea);
  textarea.select();

  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return success;
}
