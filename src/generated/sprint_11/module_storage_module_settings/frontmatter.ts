// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 11-1
// @task-title: `module:storage`, `module:settings`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// CoDD Traceability: sprint=11, task=11-1, modules=[storage,editor]
// Lightweight frontend-side frontmatter boundary detection.
// Authoritative YAML parsing is done by serde_yaml on the Rust side.
// This module only detects the --- delimiters for:
//   1. Copy-button: extracting body text (excluding frontmatter)
//   2. CodeMirror decoration: determining the frontmatter line range

/** Delimiter line for YAML frontmatter */
const DELIMITER = '---';

export interface FrontmatterBounds {
  /** 0-based line index of opening --- */
  readonly startLine: number;
  /** 0-based line index of closing --- */
  readonly endLine: number;
  /** Character offset where frontmatter block starts (always 0) */
  readonly startOffset: number;
  /** Character offset immediately after the closing --- newline */
  readonly endOffset: number;
}

/**
 * Detect the frontmatter block boundaries in a document string.
 * Returns null if the document does not start with "---".
 *
 * Detection rules (mirrors Rust parser logic):
 *   1. First line must be exactly "---"
 *   2. Scan subsequent lines for the first line that is exactly "---"
 *   3. If found, that is the closing delimiter
 */
export function detectFrontmatter(doc: string): FrontmatterBounds | null {
  if (!doc.startsWith(DELIMITER)) {
    return null;
  }

  const lines = doc.split('\n');
  if (lines.length === 0) {
    return null;
  }

  const firstLine = lines[0].trimEnd();
  if (firstLine !== DELIMITER) {
    return null;
  }

  // Search for closing delimiter starting from line 1
  let offset = lines[0].length + 1; // +1 for \n
  for (let i = 1; i < lines.length; i++) {
    const trimmed = lines[i].trimEnd();
    if (trimmed === DELIMITER) {
      return {
        startLine: 0,
        endLine: i,
        startOffset: 0,
        endOffset: offset + lines[i].length + (i < lines.length - 1 ? 1 : 0),
      };
    }
    offset += lines[i].length + 1;
  }

  return null;
}

/**
 * Extract the body text from a full .md note content, excluding the frontmatter block.
 * If no frontmatter is detected the entire content is returned.
 *
 * Used by the 1-click copy button (AC-ED-05): copies body WITHOUT frontmatter.
 */
export function extractBody(content: string): string {
  const bounds = detectFrontmatter(content);
  if (bounds === null) {
    return content;
  }
  // Skip past the closing --- and any immediately following newline
  let idx = bounds.endOffset;
  if (idx < content.length && content[idx] === '\n') {
    idx += 1;
  }
  return content.substring(idx);
}

/**
 * Build the initial frontmatter template for a new note.
 * Used when Cmd+N / Ctrl+N creates a new note.
 */
export function newNoteFrontmatter(): string {
  return '---\ntags: []\n---\n\n';
}
