// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 48-1
// @task-title: 対象モジュール
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=48, task=48-1, module=clipboard
// Clipboard write utility with fallback for module:editor's 1-click copy button.
// Uses navigator.clipboard.writeText() (Secure Context, supported in Tauri WebView)
// with document.execCommand('copy') as legacy fallback.

/**
 * Write text to the system clipboard.
 *
 * Primary: navigator.clipboard.writeText() (async Clipboard API).
 * Fallback: hidden textarea + document.execCommand('copy').
 *
 * This function MUST only be called from a user-initiated event handler
 * (click, keydown) to satisfy browser permission requirements.
 *
 * @param text The string to copy to the clipboard.
 * @throws If both primary and fallback methods fail.
 */
export async function writeToClipboard(text: string): Promise<void> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fallthrough to legacy method.
    }
  }
  fallbackCopy(text);
}

/**
 * Legacy clipboard copy using a temporary textarea and execCommand.
 * Used when navigator.clipboard is unavailable or rejects.
 */
function fallbackCopy(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  // Prevent visual flash: position off-screen.
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const success = document.execCommand("copy");
    if (!success) {
      throw new Error("execCommand('copy') returned false");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}
