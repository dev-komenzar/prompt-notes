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
// @codd:trace detail:editor_clipboard §4.3, detail:editor_clipboard §3.1
// Clipboard write with fallback per design:
//   Primary:  navigator.clipboard.writeText()
//   Fallback: document.execCommand('copy') via hidden textarea
// Note: navigator.clipboard.writeText() is invoked ONLY within
// a user-initiated click handler (security constraint §4.8).
// This module does NOT go through Tauri IPC — clipboard write is
// a WebView-local browser API call (§2.2 note: IPC non-経由).

import type { ClipboardWriteResult } from './types';
import { FALLBACK_COPY_TIMEOUT_MS } from './constants';

/**
 * Write text to the system clipboard using the modern Clipboard API.
 * Tauri WebView is a Secure Context, so this API is available on
 * both WebKitGTK (Linux) and WKWebView (macOS).
 */
async function writeViaClipboardApi(text: string): Promise<ClipboardWriteResult> {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true, method: 'clipboard-api' };
  } catch (err: unknown) {
    return { success: false, method: 'clipboard-api', error: err };
  }
}

/**
 * Fallback clipboard write using a hidden textarea and execCommand.
 * Used when navigator.clipboard is unavailable or rejects.
 */
function writeViaExecCommand(text: string): ClipboardWriteResult {
  const textarea = document.createElement('textarea');
  textarea.value = text;

  // Position off-screen to avoid layout shift
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);

  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    return {
      success: ok,
      method: 'exec-command',
      error: ok ? undefined : new Error('execCommand returned false'),
    };
  } catch (err: unknown) {
    return { success: false, method: 'exec-command', error: err };
  } finally {
    document.body.removeChild(textarea);
  }
}

/**
 * Write text to the system clipboard.
 *
 * Strategy:
 * 1. Try navigator.clipboard.writeText() (preferred, async).
 * 2. On failure, fall back to document.execCommand('copy').
 *
 * Must be called from a user-gesture event handler (click).
 */
export async function writeToClipboard(text: string): Promise<ClipboardWriteResult> {
  // Guard: if clipboard API is available, attempt it first
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    const result = await writeViaClipboardApi(text);
    if (result.success) {
      return result;
    }
    // Primary failed — fall through to execCommand
  }

  // Fallback
  return writeViaExecCommand(text);
}
