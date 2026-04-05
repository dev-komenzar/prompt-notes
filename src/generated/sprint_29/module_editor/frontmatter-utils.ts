// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 29-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated sprint:29 task:29-1 module:editor
// CoDD trace: detail:storage_fileformat §1.2, detail:editor_clipboard §4.4
// Frontmatter: YAML format, tags field only. Created date derived from filename.
// Additional fields require a requirements change (CONV-FRONTMATTER).

const FRONTMATTER_DELIMITER = '---';

const EMPTY_FRONTMATTER_TEMPLATE = `---\ntags: []\n---\n\n`;

/**
 * Returns the initial frontmatter template for a new note.
 * Template structure:
 * ```
 * ---
 * tags: []
 * ---
 *
 * ```
 */
export function createFrontmatterTemplate(): string {
  return EMPTY_FRONTMATTER_TEMPLATE;
}

/**
 * Detects the frontmatter block in a document and returns the line range
 * (1-based inclusive) of the opening `---` through the closing `---`.
 * Returns null if no valid frontmatter block is found.
 */
export function detectFrontmatterLines(
  lines: readonly string[],
): { startLine: number; endLine: number } | null {
  if (lines.length === 0) return null;
  if (lines[0].trim() !== FRONTMATTER_DELIMITER) return null;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      return { startLine: 0, endLine: i };
    }
  }
  return null;
}

/**
 * Returns the character offset immediately after the frontmatter block
 * (including one trailing blank line if present). This is the position
 * where the cursor should be placed for new notes.
 */
export function getBodyStartPosition(content: string): number {
  const lines = content.split('\n');
  const range = detectFrontmatterLines(lines);
  if (range === null) return 0;

  let pos = 0;
  for (let i = 0; i <= range.endLine; i++) {
    pos += lines[i].length + 1;
  }

  // Skip one blank line after frontmatter if present
  if (range.endLine + 1 < lines.length && lines[range.endLine + 1].trim() === '') {
    pos += lines[range.endLine + 1].length + 1;
  }

  return Math.min(pos, content.length);
}

/**
 * Extracts the body text (everything after the frontmatter block).
 * If no frontmatter is present, returns the full content unchanged.
 * A leading blank line after the closing `---` is stripped.
 */
export function extractBodyText(fullContent: string): string {
  const lines = fullContent.split('\n');
  const range = detectFrontmatterLines(lines);
  if (range === null) return fullContent;

  const bodyLines = lines.slice(range.endLine + 1);
  const body = bodyLines.join('\n');

  // Strip a single leading newline (blank separator line)
  return body.startsWith('\n') ? body.slice(1) : body;
}
