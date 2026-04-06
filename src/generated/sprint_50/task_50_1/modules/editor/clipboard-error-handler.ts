// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 50-1
// @task-title: 全モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=50, task=50-1, module=editor, resolves=OQ-006
// Clipboard copy error handling with fallback mechanism.
// The 1-click copy button is core UX (RBC-1). Errors must be handled gracefully.

import { toastStore } from '../../lib/toast-store';

/**
 * Attempts to copy text to clipboard with fallback.
 *
 * Primary: navigator.clipboard.writeText() (Web Clipboard API)
 * Fallback: textarea + document.execCommand('copy') (legacy)
 *
 * Shows toast notification on success or failure.
 *
 * @param text - The text to copy (full document including frontmatter)
 * @returns true if copy succeeded, false otherwise
 */
export async function copyToClipboardWithFeedback(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toastStore.push({
      message: 'クリップボードにコピーしました',
      severity: 'info',
      durationMs: 1500,
    });
    return true;
  } catch {
    // Fallback for environments where Clipboard API is restricted
    const fallbackResult = fallbackCopy(text);
    if (fallbackResult) {
      toastStore.push({
        message: 'クリップボードにコピーしました',
        severity: 'info',
        durationMs: 1500,
      });
      return true;
    }

    toastStore.push({
      message: 'クリップボードへのコピーに失敗しました。',
      severity: 'error',
    });
    return false;
  }
}

/**
 * Fallback clipboard copy using a temporary textarea and execCommand.
 * Used when navigator.clipboard.writeText() is not available or fails.
 */
function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;

  // Prevent scroll-to-bottom on iOS/Safari
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);

  try {
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const success = document.execCommand('copy');
    return success;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
