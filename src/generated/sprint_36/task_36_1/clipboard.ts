// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 36-1
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
// Provides clipboard write with fallback for WebView environments.
// Used by module:editor CopyButton component.
// navigator.clipboard.writeText() is a browser-standard API and does NOT go
// through Tauri IPC (not a filesystem operation, CONV-1 does not apply).
// CoDD trace: detail:editor_clipboard

/**
 * Result of a clipboard write operation.
 */
export interface ClipboardWriteResult {
  readonly success: boolean;
  readonly method: "clipboard-api" | "exec-command" | "none";
  readonly error?: string;
}

/**
 * Write text to the system clipboard.
 * Primary method: navigator.clipboard.writeText() (Secure Context).
 * Fallback: textarea + document.execCommand('copy').
 *
 * Tauri WebView is treated as a Secure Context, so the Clipboard API
 * is available on both WebKitGTK (Linux) and WKWebView (macOS).
 *
 * Must be called within a user-initiated event handler (click).
 *
 * @param text - The text to copy to the clipboard.
 * @returns Result indicating success and which method was used.
 */
export async function writeToClipboard(text: string): Promise<ClipboardWriteResult> {
  // Primary: Clipboard API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: "clipboard-api" };
    } catch (err) {
      // Fall through to legacy method
      const errorMessage = err instanceof Error ? err.message : String(err);
      return fallbackCopy(text, errorMessage);
    }
  }

  // Fallback if Clipboard API is not available
  return fallbackCopy(text);
}

/**
 * Legacy clipboard copy using a hidden textarea and execCommand.
 * Used as fallback when navigator.clipboard is unavailable or fails.
 */
function fallbackCopy(
  text: string,
  primaryError?: string,
): ClipboardWriteResult {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;

    // Position offscreen to avoid visual flash
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (success) {
      return { success: true, method: "exec-command" };
    }

    return {
      success: false,
      method: "none",
      error: primaryError
        ? `Clipboard API: ${primaryError}; execCommand also failed`
        : "execCommand('copy') returned false",
    };
  } catch (err) {
    const fallbackError = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      method: "none",
      error: primaryError
        ? `Clipboard API: ${primaryError}; Fallback: ${fallbackError}`
        : fallbackError,
    };
  }
}
