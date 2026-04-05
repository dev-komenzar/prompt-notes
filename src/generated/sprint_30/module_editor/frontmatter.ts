// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 30-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:30 | module:editor | CoDD trace: detail:editor_clipboard, detail:storage_fileformat
// Frontmatter detection, body extraction, and template generation.
// Visual decoration is in frontmatter-decoration.ts (CodeMirror plugin).
// YAML parsing for data extraction is module:storage (Rust side) only.

const DELIMITER = '---';

/** Empty frontmatter template for new notes. */
export const FRONTMATTER_TEMPLATE = `---\ntags: []\n---\n\n`;

export interface FrontmatterRange {
  /** Character offset of the opening delimiter start (always 0). */
  from: number;
  /** Character offset of the newline at end of closing delimiter line. */
  to: number;
}

/**
 * Detects the frontmatter region in a document string.
 * Returns start/end character positions or null if no valid frontmatter.
 */
export function detectFrontmatterRange(doc: string): FrontmatterRange | null {
  if (!doc.startsWith(DELIMITER)) {
    return null;
  }

  const firstNewline = doc.indexOf('\n');
  if (firstNewline === -1) {
    return null;
  }

  if (doc.substring(0, firstNewline).trim() !== DELIMITER) {
    return null;
  }

  let pos = firstNewline + 1;
  while (pos < doc.length) {
    const lineEnd = doc.indexOf('\n', pos);
    const line =
      lineEnd === -1
        ? doc.substring(pos).trim()
        : doc.substring(pos, lineEnd).trim();

    if (line === DELIMITER) {
      const endPos = lineEnd === -1 ? doc.length : lineEnd;
      return { from: 0, to: endPos };
    }

    if (lineEnd === -1) {
      break;
    }
    pos = lineEnd + 1;
  }

  return null;
}

/**
 * Extracts body text excluding the frontmatter block and the
 * conventional blank line separator after it.
 */
export function extractBody(doc: string): string {
  const range = detectFrontmatterRange(doc);
  if (range === null) {
    return doc;
  }

  let bodyStart = range.to;
  // Skip newline at end of closing delimiter
  if (bodyStart < doc.length && doc[bodyStart] === '\n') {
    bodyStart += 1;
  }
  // Skip conventional blank line separator
  if (bodyStart < doc.length && doc[bodyStart] === '\n') {
    bodyStart += 1;
  }
  return doc.substring(bodyStart);
}

/**
 * Returns the cursor position immediately after the frontmatter
 * (after closing delimiter + blank line). Used to place caret in body area.
 */
export function getCursorPositionAfterFrontmatter(doc: string): number {
  const range = detectFrontmatterRange(doc);
  if (range === null) {
    return 0;
  }

  let pos = range.to;
  if (pos < doc.length && doc[pos] === '\n') {
    pos += 1;
  }
  if (pos < doc.length && doc[pos] === '\n') {
    pos += 1;
  }
  return pos;
}
