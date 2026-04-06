// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 66-1
// @task-title: M3（M3-03）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 66 · M3-03 · OQ-002 frontmatter decoration
// module:editor — Frontmatter range detection (pure logic, shared by both approaches)

import type { Text } from '@codemirror/state';

/**
 * Represents the detected YAML frontmatter block within a CodeMirror document.
 */
export interface FrontmatterRange {
  /** Absolute start position (beginning of opening `---` line). */
  readonly from: number;
  /** Absolute end position (end of closing `---` line, exclusive of newline). */
  readonly to: number;
  /** 1-based line number of the opening delimiter. */
  readonly startLine: number;
  /** 1-based line number of the closing delimiter. */
  readonly endLine: number;
}

/**
 * Detect a YAML frontmatter block in a CodeMirror `Text` document.
 *
 * Rules (per storage_fileformat_design §1.2 / editor_clipboard_design §4.2):
 *   1. The very first line of the document must be exactly `---` (trimmed).
 *   2. A subsequent line that is exactly `---` (trimmed) closes the block.
 *   3. If no closing delimiter is found the document has no valid frontmatter.
 *
 * Complexity is O(f) where f = number of frontmatter lines (typically < 10).
 */
export function detectFrontmatterRange(doc: Text): FrontmatterRange | null {
  if (doc.lines < 2) {
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

  return null;
}
