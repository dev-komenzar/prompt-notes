// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 72-1
// @task-title: M3（M3-06）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:72 | task:72-1 | module:editor | OQ-E02
import type { CopyResult } from './types';

/**
 * Copies the supplied text to the system clipboard.
 *
 * Primary path uses `navigator.clipboard.writeText()` which is available
 * in Tauri's WebView (Secure Context). Falls back to the legacy
 * `document.execCommand('copy')` technique on failure.
 *
 * The function must only be called in response to a user-initiated event
 * (e.g. click) to satisfy browser permission policies.
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch {
      // Clipboard API rejected — try fallback.
    }
  }
  return fallbackCopy(text);
}

/**
 * Legacy clipboard write via a hidden textarea + execCommand.
 */
function fallbackCopy(text: string): CopyResult {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  Object.assign(textarea.style, {
    position: 'absolute',
    left: '-9999px',
    top: '-9999px',
    opacity: '0',
  } satisfies Partial<CSSStyleDeclaration>);

  document.body.appendChild(textarea);
  try {
    textarea.select();
    const ok = document.execCommand('copy');
    return ok
      ? { success: true }
      : { success: false, error: new Error('execCommand("copy") returned false') };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  } finally {
    document.body.removeChild(textarea);
  }
}
