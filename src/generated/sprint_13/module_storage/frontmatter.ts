// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 13-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:13 task:13-1 module:storage
// Frontend-side frontmatter utilities.
//   - Template generation for new notes (module:editor create_note flow).
//   - Body extraction for clipboard copy (module:editor CopyButton).
//   - Line-range detection for CodeMirror 6 background decoration.
// Structural YAML parsing (serde_yaml) is exclusively owned by the Rust backend.

const DELIMITER = '---';

/**
 * Generates the initial frontmatter + blank-line template inserted into a new note.
 *
 * ```
 * ---
 * tags: []
 * ---
 *
 * ```
 */
export function createFrontmatterTemplate(tags: string[] = []): string {
  const value = tags.length > 0 ? `[${tags.join(', ')}]` : '[]';
  return `${DELIMITER}\ntags: ${value}\n${DELIMITER}\n\n`;
}

/**
 * Extracts the body portion of a note (everything after the closing `---`),
 * stripping leading blank lines. Returns the full content unchanged when no
 * frontmatter block is detected.
 *
 * Used by module:editor CopyButton (AC-ED-05: copy body excluding frontmatter).
 */
export function extractBody(content: string): string {
  if (!content.startsWith(DELIMITER)) {
    return content;
  }

  const searchFrom = DELIMITER.length;
  const closingIdx = content.indexOf(`\n${DELIMITER}`, searchFrom);
  if (closingIdx === -1) {
    return content;
  }

  const bodyStart = closingIdx + 1 + DELIMITER.length;
  return content.substring(bodyStart).replace(/^\n+/, '');
}

/**
 * Detects the frontmatter block and returns its inclusive line range
 * (0-indexed), or null when no valid frontmatter block is present.
 *
 * Used by module:editor CodeMirror 6 decoration to apply background colour
 * to the frontmatter region (AC-ED-03).
 */
export function getFrontmatterLineRange(
  content: string,
): { startLine: number; endLine: number } | null {
  const lines = content.split('\n');
  if (lines.length === 0 || lines[0].trim() !== DELIMITER) {
    return null;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === DELIMITER) {
      return { startLine: 0, endLine: i };
    }
  }

  return null;
}

/**
 * Returns the character position (0-based offset) immediately after the
 * frontmatter closing delimiter line, suitable for placing the CodeMirror
 * cursor at the start of the body area after creating a new note.
 *
 * Returns 0 when no frontmatter is detected.
 */
export function getBodyStartOffset(content: string): number {
  const range = getFrontmatterLineRange(content);
  if (range === null) {
    return 0;
  }

  const lines = content.split('\n');
  let offset = 0;
  for (let i = 0; i <= range.endLine; i++) {
    offset += lines[i].length + 1; // +1 for the '\n'
  }

  // Skip one blank line after frontmatter if present
  if (offset < content.length && content[offset] === '\n') {
    offset += 1;
  }

  return offset;
}
