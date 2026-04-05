// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 12-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=12 task=12-1 module=clipboard
// Clipboard utility with fallback for CopyButton.svelte.
// Uses navigator.clipboard.writeText() (Secure Context — Tauri WebView qualifies).
// Fallback: textarea + document.execCommand('copy') for edge cases.
// Note: Clipboard operations do NOT go through Tauri IPC — they use browser-native
// APIs within WebView, which is permitted (not a filesystem operation).

/**
 * Result of a clipboard write operation.
 */
export interface ClipboardWriteResult {
  readonly success: boolean;
  readonly method: 'clipboard-api' | 'execcommand-fallback';
}

/**
 * Write text to the system clipboard.
 * Primary: navigator.clipboard.writeText() (async Clipboard API).
 * Fallback: hidden textarea + document.execCommand('copy').
 *
 * Must be called from a user-initiated event handler (click).
 */
export async function writeToClipboard(text: string): Promise<ClipboardWriteResult> {
  // Primary method: Clipboard API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: 'clipboard-api' };
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback: execCommand('copy') via temporary textarea
  return fallbackCopy(text);
}

function fallbackCopy(text: string): ClipboardWriteResult {
  const textarea = document.createElement('textarea');
  textarea.value = text;

  // Position off-screen to avoid visual flash
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';

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

  return { success, method: 'execcommand-fallback' };
}
