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

// CoDD Traceability: sprint=65, task=65-1, module=editor+storage
// Frontmatter template generation and body extraction for the editor.
// YAML frontmatter parsing for data extraction is owned by module:storage (Rust/serde_yaml).
// This module handles only UI-layer concerns: template strings and visual boundary detection.

/**
 * Delimiter used to open and close YAML frontmatter blocks.
 */
export const FRONTMATTER_DELIMITER = "---";

/**
 * Generates the initial frontmatter template for a newly created note.
 * Called by module:editor after create_note IPC returns.
 * The template is saved via auto-save (500ms debounce → save_note IPC).
 */
export function createFrontmatterTemplate(tags: readonly string[] = []): string {
  const tagList = tags.length > 0 ? tags.join(", ") : "";
  return `---\ntags: [${tagList}]\n---\n\n`;
}

/**
 * Detects the line range of the frontmatter block within a document string.
 * Used by the CodeMirror 6 decoration extension to apply background color.
 *
 * @returns Inclusive start and end line numbers (0-based), or null if no valid frontmatter.
 */
export function detectFrontmatterRange(
  doc: string,
): { startLine: number; endLine: number } | null {
  const lines = doc.split("\n");
  if (lines.length === 0) return null;

  // First line must be exactly "---"
  if (lines[0].trim() !== FRONTMATTER_DELIMITER) return null;

  // Search for closing delimiter starting from line 1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      return { startLine: 0, endLine: i };
    }
  }

  // No closing delimiter found
  return null;
}

/**
 * Extracts the body text (everything after the frontmatter block).
 * If no frontmatter is detected, returns the entire document.
 *
 * Note: The copy button copies the full document (frontmatter included)
 * per CONV-3. This function is provided as a utility for contexts
 * that need body-only content.
 */
export function extractBody(doc: string): string {
  const lines = doc.split("\n");
  if (lines.length === 0) return "";

  if (lines[0].trim() !== FRONTMATTER_DELIMITER) return doc;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      // Return everything after the closing delimiter
      const bodyLines = lines.slice(i + 1);
      // Trim leading empty line that conventionally follows frontmatter
      const body = bodyLines.join("\n");
      return body.startsWith("\n") ? body.slice(1) : body;
    }
  }

  // No closing delimiter: treat entire doc as body
  return doc;
}

/**
 * Computes the character offset range of the frontmatter block
 * suitable for CodeMirror 6 Decoration positioning.
 *
 * @returns { from, to } character offsets (inclusive of delimiters), or null.
 */
export function getFrontmatterCharRange(
  doc: string,
): { from: number; to: number } | null {
  const range = detectFrontmatterRange(doc);
  if (range === null) return null;

  const lines = doc.split("\n");
  let from = 0;
  let to = 0;
  for (let i = 0; i <= range.endLine; i++) {
    if (i === 0) {
      from = 0;
    }
    to += lines[i].length;
    if (i < range.endLine) {
      to += 1; // newline character
    }
  }
  return { from, to };
}
