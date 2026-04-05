// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 32-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd:generated sprint=32 task=32-1 module=editor
// Traceability: detail:editor_clipboard §4.4, detail:storage_fileformat §1.2
// frontmatter has tags field only. No title field (CONV — title input prohibited).

/**
 * Default frontmatter template for new notes.
 * Only `tags` field is permitted per CONV-FRONTMATTER.
 */
export const FRONTMATTER_TEMPLATE = `---
tags: []
---

`;

/**
 * Calculates the cursor position after frontmatter (first line of body).
 * The cursor is placed at the start of the body area after the closing `---`.
 */
export function getBodyStartPosition(doc: string): number {
  const lines = doc.split("\n");
  if (lines.length === 0 || lines[0] !== "---") {
    return 0;
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      // Position after closing --- and the blank line
      let pos = 0;
      for (let j = 0; j <= i; j++) {
        pos += lines[j].length + 1; // +1 for newline
      }
      // Skip the blank line after frontmatter if present
      if (i + 1 < lines.length && lines[i + 1] === "") {
        pos += 1;
      }
      return pos;
    }
  }
  return 0;
}

/**
 * Extracts the body text from a document (excluding frontmatter).
 * Used by the copy button to copy body only.
 */
export function extractBody(doc: string): string {
  const lines = doc.split("\n");
  if (lines.length === 0 || lines[0] !== "---") {
    return doc;
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      const bodyLines = lines.slice(i + 1);
      const body = bodyLines.join("\n");
      // Trim leading blank line if present
      return body.startsWith("\n") ? body.slice(1) : body;
    }
  }
  return doc;
}
