// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 解決マイルストーン
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=65, task=65-1, module=editor
// Clipboard write utility with execCommand fallback.
// Used exclusively by CopyButton.svelte (module:editor).
// Clipboard operations use browser-standard APIs (not IPC) since they
// do not constitute filesystem access and are permitted under CONV-1.

/**
 * Result of a clipboard write attempt.
 */
export interface ClipboardResult {
  readonly success: boolean;
  readonly method: "clipboard-api" | "exec-command" | "none";
}

/**
 * Writes text to the system clipboard.
 * Primary: navigator.clipboard.writeText (Secure Context, supported by Tauri WebView).
 * Fallback: textarea + document.execCommand('copy').
 *
 * Must be called within a user-initiated event handler (click).
 */
export async function writeToClipboard(text: string): Promise<ClipboardResult> {
  // Primary: Clipboard API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, method: "clipboard-api" };
    } catch {
      // Fall through to legacy method
    }
  }

  // Fallback: execCommand
  return fallbackCopy(text);
}

/**
 * Legacy clipboard copy using a temporary textarea and execCommand.
 */
function fallbackCopy(text: string): ClipboardResult {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    return { success: ok, method: "exec-command" };
  } catch {
    return { success: false, method: "none" };
  } finally {
    document.body.removeChild(textarea);
  }
}
