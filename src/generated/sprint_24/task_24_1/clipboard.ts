// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 24-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// PromptNotes — Clipboard Utility
// Handles system clipboard write with fallback for environments
// where navigator.clipboard may not be available.
// Used exclusively within CopyButton.svelte via user-initiated click events.
// This is a WebView-internal operation; no Tauri IPC required.

/**
 * Copy text to system clipboard.
 *
 * Primary method: navigator.clipboard.writeText() (Secure Context API).
 * Tauri WebView qualifies as a Secure Context, so this works on both
 * Linux (WebKitGTK) and macOS (WKWebView).
 *
 * Fallback: textarea + document.execCommand('copy') for edge cases.
 *
 * Must be called from a user-gesture event handler (click) to satisfy
 * browser security requirements. Automatic/programmatic clipboard writes
 * without user gesture are prohibited by design.
 *
 * @returns true if copy succeeded, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopy(text);
    }
  }
  return fallbackCopy(text);
}

/**
 * Fallback clipboard copy using a temporary textarea and execCommand.
 * Used when navigator.clipboard API is unavailable.
 */
function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  try {
    textarea.select();
    const success = document.execCommand('copy');
    return success;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
