// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-2
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// Client-side frontmatter utilities.
// Authoritative serialization/deserialization lives in Rust (storage.rs).
// These helpers support display, editing, and body extraction in the WebView.

/**
 * Extract body text from a full note document string (frontmatter + body).
 * Used by CopyButton to exclude frontmatter from clipboard content.
 */
export function extractBody(doc: string): string {
  if (!doc.startsWith('---\n')) return doc;
  const closeIdx = doc.indexOf('\n---\n', 4);
  if (closeIdx === -1) return doc;
  return doc.slice(closeIdx + 5);
}

/**
 * Parse a raw tags value from YAML frontmatter into a string array.
 * Handles both array and missing/null cases defensively.
 */
export function parseTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === 'string' && t.trim().length > 0);
}

/**
 * Normalize a free-form tag input string (e.g. "rust, tauri coding")
 * into a deduplicated array of lowercase tag tokens.
 */
export function parseTagInput(input: string): string[] {
  const tokens = input
    .split(/[,\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
  return [...new Set(tokens)];
}

/**
 * Render the tags array as a display string for input fields.
 */
export function tagsToInputValue(tags: string[]): string {
  return tags.join(', ');
}

/**
 * Build the full file content string (frontmatter + body).
 * Mirrors the format that Rust storage.rs produces.
 * Used only for local display/diff purposes; actual persistence goes via IPC.
 */
export function buildFileContent(tags: string[], body: string): string {
  const tagsLine =
    tags.length > 0 ? `[${tags.join(', ')}]` : '[]';
  return `---\ntags: ${tagsLine}\n---\n${body}`;
}
