// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 35-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:editor — Frontmatter template generation and body extraction.
// Frontmatter spec: YAML with tags-only field. Created-at derived from filename.

/**
 * Empty frontmatter template inserted on new-note creation.
 * Trailing newline positions the cursor on the first body line.
 */
export const FRONTMATTER_TEMPLATE = '---\ntags: []\n---\n\n';

/** Regex matching a complete YAML frontmatter block at the start of a document. */
const FRONTMATTER_RE = /^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n/;

/**
 * Extract the body text (everything after the closing `---`), excluding frontmatter.
 * If no valid frontmatter block is present the full content is returned.
 */
export function extractBody(content: string): string {
  const match = FRONTMATTER_RE.exec(content);
  if (!match) return content;
  return content.slice(match[0].length);
}

/**
 * Extract the raw frontmatter block (including delimiters), or null if absent.
 */
export function extractFrontmatterBlock(content: string): string | null {
  const match = FRONTMATTER_RE.exec(content);
  return match ? match[0] : null;
}

/**
 * Return the character offset where the cursor should be placed after the
 * frontmatter in the given template / content string.
 * Falls back to end-of-string if no frontmatter is detected.
 */
export function cursorPositionAfterFrontmatter(content: string): number {
  const match = FRONTMATTER_RE.exec(content);
  return match ? match[0].length : content.length;
}

/**
 * Detect frontmatter line range within a CodeMirror-style line-numbered document.
 * Returns inclusive 1-based line numbers { startLine, endLine } or null.
 */
export function detectFrontmatterLines(
  getLine: (lineNumber: number) => string,
  totalLines: number,
): { startLine: number; endLine: number } | null {
  if (totalLines < 1) return null;
  if (getLine(1).trim() !== '---') return null;

  for (let i = 2; i <= totalLines; i++) {
    if (getLine(i).trim() === '---') {
      return { startLine: 1, endLine: i };
    }
  }
  return null;
}
