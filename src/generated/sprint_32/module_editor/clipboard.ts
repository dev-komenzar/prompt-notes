// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=32 task=32-1 module=editor
// Traceability: detail:editor_clipboard §4.3
// CONV: 1-click copy button is core UX. Release-blocked if missing (RBC-1).
// Clipboard API runs in WebView (Secure Context via Tauri). No IPC needed.

/**
 * Copies text to the system clipboard using navigator.clipboard API.
 * Falls back to execCommand('copy') if clipboard API is unavailable.
 *
 * @param text - The text to copy
 * @returns true if copy succeeded
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return fallbackCopy(text);
  }
}

/**
 * Fallback copy using textarea + execCommand for environments
 * where navigator.clipboard is unavailable.
 */
function fallbackCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);

  try {
    textarea.select();
    const result = document.execCommand("copy");
    return result;
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
