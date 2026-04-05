// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 33-1
// @task-title: 共有層
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=33, task=33-1, module=shared, node=detail:editor_clipboard
// Frontmatter utilities for module:editor.
// Note: Structural YAML parsing of frontmatter is done exclusively on the Rust
// side (serde_yaml). These helpers deal only with string-level operations needed
// by the frontend (template generation, body extraction for copy).

/**
 * The empty frontmatter template inserted into newly created notes.
 * Must match the Rust-side initial file content written by create_note.
 */
export const FRONTMATTER_TEMPLATE = `---\ntags: []\n---\n\n`;

/**
 * Extract the body text from a full document string by stripping the
 * frontmatter block (the leading `---` … `---` section).
 *
 * If no valid frontmatter is detected the entire text is returned as-is.
 *
 * @param doc Full document content (frontmatter + body)
 * @returns Body text with leading blank line trimmed
 */
export function extractBody(doc: string): string {
  if (!doc.startsWith('---')) {
    return doc;
  }
  // Find the closing delimiter starting after the first "---\n"
  const endIdx = doc.indexOf('\n---', 3);
  if (endIdx === -1) {
    // Unclosed frontmatter — return entire text
    return doc;
  }
  // Skip past the closing "---\n"
  const afterFrontmatter = endIdx + 4; // length of "\n---"
  let body = doc.substring(afterFrontmatter);
  // Strip a single leading newline if present (standard md convention)
  if (body.startsWith('\n')) {
    body = body.substring(1);
  }
  return body;
}

/**
 * Detect the line range (0-based) of the frontmatter block within a document.
 *
 * @returns `{ startLine, endLine }` (both inclusive) or `null` when no valid
 *          frontmatter is found. These values are suitable for CodeMirror line-based
 *          Decoration targeting.
 */
export function detectFrontmatterRange(
  doc: string,
): { startLine: number; endLine: number } | null {
  const lines = doc.split('\n');
  if (lines.length === 0 || lines[0].trim() !== '---') {
    return null;
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      return { startLine: 0, endLine: i };
    }
  }
  return null;
}
