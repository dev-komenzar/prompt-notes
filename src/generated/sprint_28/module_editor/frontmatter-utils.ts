// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 28-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 28 | Task 28-1 | module:editor
// Traceability: detail:editor_clipboard §4.2, detail:storage_fileformat §1.2
// Utilities for frontmatter range detection and body text extraction.

import type { Text } from '@codemirror/state';

export interface FrontmatterRange {
  /** 1-based line number of opening --- */
  startLine: number;
  /** 1-based line number of closing --- */
  endLine: number;
  /** Character offset of the first character of the opening --- */
  from: number;
  /** Character offset after the newline following the closing --- */
  to: number;
}

/**
 * Detects a valid YAML frontmatter block at the start of a CodeMirror document.
 * Returns the range if both opening and closing `---` delimiters are found,
 * or null if frontmatter is absent or incomplete (partial state).
 */
export function detectFrontmatterRange(doc: Text): FrontmatterRange | null {
  if (doc.lines < 2) return null;

  const firstLine = doc.line(1);
  if (firstLine.text.trimEnd() !== '---') return null;

  for (let i = 2; i <= doc.lines; i++) {
    const line = doc.line(i);
    if (line.text.trimEnd() === '---') {
      const closingLineEnd = line.to;
      const to =
        i < doc.lines ? closingLineEnd + 1 : closingLineEnd;
      return {
        startLine: 1,
        endLine: i,
        from: firstLine.from,
        to,
      };
    }
  }

  return null;
}

/**
 * Extracts body text from a raw document string, excluding the YAML frontmatter block.
 * Used by the copy-to-clipboard function (AC-ED-05: copy body only, exclude frontmatter).
 */
export function extractBodyText(fullText: string): string {
  const lines = fullText.split('\n');
  if (lines.length < 2 || lines[0].trimEnd() !== '---') {
    return fullText;
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trimEnd() === '---') {
      const bodyStart = i + 1;
      const body = lines.slice(bodyStart).join('\n');
      return body.replace(/^\n+/, '');
    }
  }

  return fullText;
}

/**
 * Returns the default frontmatter template for a new note.
 */
export function createFrontmatterTemplate(): string {
  return '---\ntags: []\n---\n\n';
}

/**
 * Computes the character offset where the body begins (after frontmatter + blank line),
 * suitable for placing the cursor on new note creation.
 */
export function getBodyStartOffset(doc: Text): number {
  const range = detectFrontmatterRange(doc);
  if (!range) return 0;
  return range.to;
}
