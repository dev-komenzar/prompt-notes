// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 2-1
// @task-title: `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint:2 task:2-1 module:shell node:detail:editor_clipboard
// Clipboard write utility with legacy fallback.
// navigator.clipboard.writeText() works in Tauri WebView (Secure Context).
// Fallback via textarea + execCommand('copy') for edge cases.

/**
 * Write text to the system clipboard.
 * Uses Clipboard API with a legacy fallback.
 *
 * @returns `true` on success, `false` on failure.
 */
export async function writeToClipboard(text: string): Promise<boolean> {
  // Primary: Clipboard API (available in Tauri WebView Secure Context)
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy approach
    }
  }

  // Fallback: textarea + execCommand
  return fallbackCopy(text);
}

function fallbackCopy(text: string): boolean {
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
  }
  document.body.removeChild(textarea);
  return success;
}
