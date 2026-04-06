// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 74-1
// @task-title: M4（M4-04）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 74 · M4-04 · OQ-SF-002: body_preview 文字数上限
// Traceability: detail:storage_fileformat §1.2, detail:editor_clipboard §4.2

/**
 * Result of splitting a Markdown document at the frontmatter boundary.
 */
export interface FrontmatterSplitResult {
  /** Raw YAML content between the --- delimiters (empty string if absent). */
  readonly frontmatter: string;
  /** Everything after the closing --- delimiter (or the full content if no frontmatter). */
  readonly body: string;
}

/**
 * Strips YAML frontmatter from a Markdown document.
 *
 * Detection rules (mirrors Rust `module:storage` behaviour):
 *  1. The document MUST start with a line that is exactly `---` (optionally
 *     followed by `\r`).
 *  2. The closing delimiter is the FIRST subsequent line that is exactly `---`.
 *  3. If either delimiter is missing the entire content is treated as body.
 *
 * The body is returned with leading blank lines preserved so that
 * character offsets remain stable for preview extraction.
 */
export function splitFrontmatter(content: string): FrontmatterSplitResult {
  if (!content.startsWith("---")) {
    return { frontmatter: "", body: content };
  }

  // Find the end of the opening delimiter line.
  const firstNewline = content.indexOf("\n");
  if (firstNewline === -1) {
    // Document is just "---" with no newline — treat as body.
    return { frontmatter: "", body: content };
  }

  // Only accept an opening line that is exactly "---" (with optional \r).
  const openingLine = content.slice(0, firstNewline).replace(/\r$/, "");
  if (openingLine !== "---") {
    return { frontmatter: "", body: content };
  }

  // Search for the closing "---" line.
  const rest = content.slice(firstNewline + 1);
  const closingPattern = /^---[ \t]*$/m;
  const match = closingPattern.exec(rest);

  if (match === null || match.index === undefined) {
    // No closing delimiter — entire content is body.
    return { frontmatter: "", body: content };
  }

  const frontmatter = rest.slice(0, match.index);
  const body = rest.slice(match.index + match[0].length);

  // Strip exactly one leading newline from body if present.
  const trimmedBody = body.startsWith("\n")
    ? body.slice(1)
    : body.startsWith("\r\n")
      ? body.slice(2)
      : body;

  return { frontmatter, body: trimmedBody };
}

/**
 * Convenience: returns only the body portion of a Markdown document,
 * with frontmatter removed.
 */
export function stripFrontmatter(content: string): string {
  return splitFrontmatter(content).body;
}
