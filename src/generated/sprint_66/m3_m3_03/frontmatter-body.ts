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
// module:editor — Body text extraction (frontmatter excluded)
//
// Used by CopyButton.svelte (AC-ED-05) to copy only the note body.
// Shares the same detection logic as the decoration extensions.

import type { Text } from '@codemirror/state';
import { detectFrontmatterRange } from './frontmatter-range';

/**
 * Extract the body portion of a document, stripping the YAML frontmatter
 * block and the conventional blank separator line that follows it.
 *
 * If no valid frontmatter is detected the entire document text is returned.
 *
 * @param doc  A CodeMirror `Text` instance (e.g. `view.state.doc`).
 * @returns    The body text without the frontmatter block.
 */
export function extractBody(doc: Text): string {
  const range = detectFrontmatterRange(doc);
  if (!range) {
    return doc.toString();
  }

  // Start scanning from the line immediately after the closing `---`.
  let bodyStartLine = range.endLine + 1;

  // Skip one blank separator line if present (conventional frontmatter format).
  if (
    bodyStartLine <= doc.lines &&
    doc.line(bodyStartLine).text.trim() === ''
  ) {
    bodyStartLine++;
  }

  if (bodyStartLine > doc.lines) {
    return '';
  }

  return doc.sliceString(doc.line(bodyStartLine).from);
}

/**
 * Check whether a document contains a syntactically valid frontmatter block.
 */
export function hasFrontmatter(doc: Text): boolean {
  return detectFrontmatterRange(doc) !== null;
}
