// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 72-1
// @task-title: M3（M3-06）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:72 | task:72-1 | module:editor | OQ-E02

/**
 * Detects the character range of a YAML frontmatter block at the start of
 * a Markdown document. Returns `null` when no valid frontmatter is present.
 *
 * A valid frontmatter block starts on the very first line with `---`,
 * and is closed by a subsequent line that is exactly `---`.
 */
export function detectFrontmatterRange(
  text: string,
): { from: number; to: number } | null {
  if (!text.startsWith('---')) {
    return null;
  }

  const firstNewline = text.indexOf('\n');
  if (firstNewline === -1) {
    return null;
  }

  // Only the opening delimiter on the first line (allow trailing whitespace).
  const openingLine = text.slice(0, firstNewline).trim();
  if (openingLine !== '---') {
    return null;
  }

  // Search for the closing delimiter starting after the first newline.
  let pos = firstNewline + 1;
  while (pos < text.length) {
    const lineEnd = text.indexOf('\n', pos);
    const line = lineEnd === -1 ? text.slice(pos) : text.slice(pos, lineEnd);

    if (line.trim() === '---') {
      let to = lineEnd === -1 ? text.length : lineEnd;
      // Include the closing newline if present.
      if (to < text.length && text[to] === '\n') {
        to += 1;
      }
      return { from: 0, to };
    }

    if (lineEnd === -1) {
      break;
    }
    pos = lineEnd + 1;
  }

  return null;
}

/**
 * Strips a YAML frontmatter block from the beginning of Markdown content.
 * If no valid frontmatter is detected the input is returned unchanged.
 */
export function stripFrontmatter(content: string): string {
  const range = detectFrontmatterRange(content);
  if (!range) {
    return content;
  }
  const body = content.slice(range.to);
  // Remove a single leading blank line after the closing delimiter.
  if (body.startsWith('\n')) {
    return body.slice(1);
  }
  return body;
}
