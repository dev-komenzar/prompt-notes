// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 28-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 28 | Task 28-1 | module:editor
// Traceability: detail:editor_clipboard §4.3, test:acceptance_criteria AC-ED-05
// 1-click copy button logic. Copies body text only (frontmatter excluded) per AC-ED-05.

import type { EditorView } from '@codemirror/view';
import { extractBodyText } from './frontmatter-utils';

/**
 * Copies the note body (excluding frontmatter) to the system clipboard.
 * Falls back to execCommand('copy') if navigator.clipboard is unavailable.
 * Returns true on success.
 */
export async function copyBodyToClipboard(view: EditorView): Promise<boolean> {
  const fullText = view.state.doc.toString();
  const bodyText = extractBodyText(fullText);

  try {
    await navigator.clipboard.writeText(bodyText);
    return true;
  } catch {
    return fallbackCopy(bodyText);
  }
}

/**
 * Copies the entire document (frontmatter + body) to the system clipboard.
 * Provided for contexts where full-document copy is desired.
 */
export async function copyFullDocumentToClipboard(view: EditorView): Promise<boolean> {
  const text = view.state.doc.toString();
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return fallbackCopy(text);
  }
}

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    const ok = document.execCommand('copy');
    return ok;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
