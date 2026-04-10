// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 4-1
// @task-title: `fs` プラグイン `deny`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/editor_clipboard_design.md
// @generated-by: codd generate --sprint 4 --task 4-1
// @trace: detail:editor_clipboard §4.3, detail:component_architecture §4.1

/**
 * Clipboard adapter using the browser-standard Clipboard API.
 *
 * PromptNotes uses `navigator.clipboard.writeText()` instead of the
 * Tauri `clipboard-manager` plugin. This module provides a thin
 * abstraction for clipboard operations, ensuring that:
 *
 * 1. No Tauri clipboard-manager plugin is imported or invoked.
 * 2. All clipboard writes go through the browser Clipboard API.
 * 3. Errors are handled uniformly.
 *
 * The Tauri WebView runs in a secure context (equivalent to HTTPS),
 * so `navigator.clipboard` is available.
 */

export interface ClipboardWriteResult {
  readonly success: boolean;
  readonly error?: string;
}

/**
 * Writes text to the system clipboard using the browser Clipboard API.
 *
 * @param text - The text content to copy.
 * @returns Result indicating success or failure.
 */
export async function writeTextToClipboard(text: string): Promise<ClipboardWriteResult> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return {
      success: false,
      error: 'Clipboard API is not available in this environment.',
    };
  }

  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Clipboard write failed: ${message}`,
    };
  }
}

/**
 * Extracts the body content from a full note document, excluding frontmatter.
 * Frontmatter is the YAML block delimited by `---` at the start of the document.
 *
 * @param document - Full note text including optional frontmatter.
 * @returns Body text without frontmatter.
 */
export function extractBodyFromDocument(document: string): string {
  const match = document.match(/^---\n[\s\S]*?\n---\n/);
  return match ? document.slice(match[0].length) : document;
}

/**
 * Copies the body (excluding frontmatter) of a note document to the clipboard.
 *
 * @param document - Full note text including optional frontmatter.
 * @returns Result indicating success or failure.
 */
export async function copyNoteBodyToClipboard(document: string): Promise<ClipboardWriteResult> {
  const body = extractBodyFromDocument(document);
  return writeTextToClipboard(body);
}
