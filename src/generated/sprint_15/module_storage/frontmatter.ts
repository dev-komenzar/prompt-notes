// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: `module:storage`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// module:storage — Frontmatter template and extraction utilities
// Canonical YAML parsing is Rust-side (serde_yaml). These utilities
// are for UI-level template generation and body extraction only.
// Sprint 15 · M2-03 · read_note IPC コマンド実装

const FRONTMATTER_DELIMITER = '---';

/**
 * Generate the initial frontmatter template for a new note.
 * Used by module:editor when creating a new note via Cmd+N / Ctrl+N.
 *
 * Output format:
 * ```
 * ---
 * tags: []
 * ---
 *
 * ```
 */
export function createFrontmatterTemplate(
  tags: readonly string[] = [],
): string {
  const tagsStr =
    tags.length > 0 ? `[${tags.join(', ')}]` : '[]';
  return `${FRONTMATTER_DELIMITER}\ntags: ${tagsStr}\n${FRONTMATTER_DELIMITER}\n\n`;
}

/**
 * Extract the body text from a note, excluding the frontmatter block.
 * Used by module:editor copy button to strip frontmatter before
 * clipboard write.
 *
 * If no valid frontmatter block is detected, returns the full content.
 */
export function extractBodyWithoutFrontmatter(content: string): string {
  const lines = content.split('\n');

  if (lines.length === 0 || lines[0].trim() !== FRONTMATTER_DELIMITER) {
    return content;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      // Skip the closing delimiter and any immediately following blank line
      const bodyStart = i + 1;
      const remaining = lines.slice(bodyStart).join('\n');
      // Trim leading newlines that separate frontmatter from body
      return remaining.replace(/^\n+/, '');
    }
  }

  // No closing delimiter found — treat entire content as body
  return content;
}

/**
 * Detect the line range of the frontmatter block within document text.
 * Returns null if no valid frontmatter block exists.
 *
 * Used by module:editor CodeMirror 6 decoration plugin to apply
 * background color to the frontmatter region.
 *
 * @returns Object with 0-based startLine and endLine (both inclusive),
 *          or null if no frontmatter is detected.
 */
export function detectFrontmatterRange(
  content: string,
): { startLine: number; endLine: number } | null {
  const lines = content.split('\n');

  if (lines.length === 0 || lines[0].trim() !== FRONTMATTER_DELIMITER) {
    return null;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FRONTMATTER_DELIMITER) {
      return { startLine: 0, endLine: i };
    }
  }

  // Opening delimiter found but no closing delimiter
  return null;
}
