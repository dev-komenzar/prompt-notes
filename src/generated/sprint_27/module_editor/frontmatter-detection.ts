// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 27-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 27 – module:editor – Frontmatter range detection (pure logic)
// Detects YAML frontmatter delimited by --- at document start.
// Used by both the decoration extension and body extraction utility.
// This is a frontend visual detection; Rust-side serde_yaml parsing is authoritative for data.

import type { Text } from '@codemirror/state';

/** Inclusive character range of the frontmatter block within the document. */
export interface FrontmatterRange {
  /** Character offset of the start of the opening --- line. */
  readonly from: number;
  /** Character offset of the end of the closing --- line (exclusive of trailing \n). */
  readonly to: number;
  /** 1-based line number of the opening ---. */
  readonly startLine: number;
  /** 1-based line number of the closing ---. */
  readonly endLine: number;
}

/**
 * Detect a complete YAML frontmatter block at the beginning of a CodeMirror Text.
 *
 * Rules:
 * - The first line must be exactly `---` (trimmed).
 * - A subsequent line that is exactly `---` (trimmed) closes the block.
 * - If no closing delimiter is found, returns null (partial/incomplete frontmatter).
 * - Returns null for empty documents.
 */
export function detectFrontmatterRange(doc: Text): FrontmatterRange | null {
  if (doc.lines === 0 || doc.length === 0) {
    return null;
  }

  const firstLine = doc.line(1);
  if (firstLine.text.trim() !== '---') {
    return null;
  }

  for (let lineNum = 2; lineNum <= doc.lines; lineNum++) {
    const line = doc.line(lineNum);
    if (line.text.trim() === '---') {
      return {
        from: firstLine.from,
        to: line.to,
        startLine: 1,
        endLine: lineNum,
      };
    }
  }

  // No closing delimiter found – incomplete frontmatter
  return null;
}

/**
 * Detect frontmatter from a raw string. Convenience wrapper for non-CM6 contexts.
 */
export function detectFrontmatterFromString(content: string): { from: number; to: number } | null {
  if (!content.startsWith('---')) {
    return null;
  }

  const firstNewline = content.indexOf('\n');
  if (firstNewline === -1) {
    return null;
  }

  let pos = firstNewline + 1;
  while (pos < content.length) {
    const lineEnd = content.indexOf('\n', pos);
    const line = lineEnd === -1 ? content.slice(pos) : content.slice(pos, lineEnd);

    if (line.trim() === '---') {
      return { from: 0, to: lineEnd === -1 ? content.length : lineEnd };
    }

    if (lineEnd === -1) break;
    pos = lineEnd + 1;
  }

  return null;
}
