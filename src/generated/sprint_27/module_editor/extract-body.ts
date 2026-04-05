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

// Sprint 27 – module:editor – Body text extraction (excludes frontmatter)
// AC-ED-05: copy target is body text excluding frontmatter.

import type { Text } from '@codemirror/state';
import { detectFrontmatterRange } from './frontmatter-detection';
import { detectFrontmatterFromString } from './frontmatter-detection';

/**
 * Extract the body portion of a CodeMirror document, excluding the YAML frontmatter block
 * and any immediately following blank line.
 *
 * If no frontmatter is detected the entire document is returned.
 */
export function extractBodyFromDoc(doc: Text): string {
  const range = detectFrontmatterRange(doc);
  if (range === null) {
    return doc.toString();
  }

  let bodyStart = range.to;

  // Advance past the newline after the closing ---
  if (bodyStart < doc.length) {
    bodyStart += 1; // skip \n
  }

  // Skip one blank line immediately after frontmatter if present
  if (bodyStart < doc.length) {
    const nextLine = doc.lineAt(bodyStart);
    if (nextLine.text.trim() === '') {
      bodyStart = nextLine.to < doc.length ? nextLine.to + 1 : doc.length;
    }
  }

  if (bodyStart >= doc.length) {
    return '';
  }

  return doc.sliceString(bodyStart);
}

/**
 * Extract body from a raw string. Convenience for non-CM6 contexts.
 */
export function extractBodyFromString(content: string): string {
  const range = detectFrontmatterFromString(content);
  if (range === null) {
    return content;
  }

  let bodyStart = range.to;

  // Skip past newline after closing ---
  if (bodyStart < content.length && content[bodyStart] === '\n') {
    bodyStart += 1;
  }

  // Skip one blank line
  if (bodyStart < content.length) {
    const nextNewline = content.indexOf('\n', bodyStart);
    const line = nextNewline === -1 ? content.slice(bodyStart) : content.slice(bodyStart, nextNewline);
    if (line.trim() === '') {
      bodyStart = nextNewline === -1 ? content.length : nextNewline + 1;
    }
  }

  if (bodyStart >= content.length) {
    return '';
  }

  return content.slice(bodyStart);
}
