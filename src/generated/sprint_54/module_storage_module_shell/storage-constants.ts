// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 54-1
// @task-title: `module:storage`, `module:shell`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Trace: sprint=54, task=54-1, modules=storage, node=detail:storage_fileformat
// Storage module constants.
// Convention 9: Filename YYYY-MM-DDTHHMMSS.md
// Convention 10: frontmatter tags only
// Convention 12: Default directories per platform
// Convention 17: Local .md files only — no DB, no cloud

/** Maximum characters for body_preview in NoteEntry (Rust-side truncation) */
export const BODY_PREVIEW_MAX_CHARS = 200;

/** Default number of days for the grid view filter window */
export const DEFAULT_FILTER_DAYS = 7;

/** YAML frontmatter delimiter */
export const FRONTMATTER_DELIMITER = '---';

/**
 * Empty frontmatter template for new notes.
 * Used by module:editor when creating a new note via Cmd+N / Ctrl+N.
 */
export const EMPTY_FRONTMATTER_TEMPLATE = `---
tags: []
---

`;

/**
 * Extracts body text from a full .md file content string (strips frontmatter).
 * Used by CopyButton to copy body only, and for display purposes.
 *
 * This is a lightweight client-side extraction for UI purposes.
 * Authoritative frontmatter parsing is done by Rust (serde_yaml).
 */
export function extractBodyFromContent(content: string): string {
  if (!content.startsWith(FRONTMATTER_DELIMITER)) {
    return content;
  }

  // Find the closing delimiter
  const closingIndex = content.indexOf(
    `\n${FRONTMATTER_DELIMITER}`,
    FRONTMATTER_DELIMITER.length
  );

  if (closingIndex === -1) {
    // No closing delimiter found — treat entire content as body
    return content;
  }

  // Skip past closing delimiter and any following newline
  const bodyStart = closingIndex + 1 + FRONTMATTER_DELIMITER.length;
  const body = content.substring(bodyStart);

  // Strip leading newline(s) after frontmatter block
  return body.replace(/^\n+/, '');
}

/**
 * Extracts the raw frontmatter YAML block (without delimiters) from content.
 * Returns null if no valid frontmatter block is found.
 */
export function extractFrontmatterYaml(content: string): string | null {
  if (!content.startsWith(FRONTMATTER_DELIMITER)) {
    return null;
  }

  const afterFirstDelimiter = FRONTMATTER_DELIMITER.length + 1; // +1 for \n
  const closingIndex = content.indexOf(
    `\n${FRONTMATTER_DELIMITER}`,
    afterFirstDelimiter - 1
  );

  if (closingIndex === -1) {
    return null;
  }

  return content.substring(afterFirstDelimiter, closingIndex).trim();
}
