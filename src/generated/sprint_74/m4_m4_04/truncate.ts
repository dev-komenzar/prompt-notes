// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 74-1
// @task-title: M4（M4-04）
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// Sprint 74 · M4-04 · OQ-SF-002: body_preview 文字数上限
// Traceability: detail:storage_fileformat §4.3, detail:grid_search §4.3

import { TRUNCATION_ELLIPSIS } from "./constants";

/**
 * Unicode-aware truncation that never splits a surrogate pair.
 *
 * Behaviour:
 *  - If `text.length <= maxLength` → return text unchanged.
 *  - Otherwise slice to `maxLength` characters, retreat to the last
 *    whitespace boundary when one exists within the trailing 20 %
 *    (to avoid cutting mid-word), then append `ellipsis`.
 *
 * The returned string length is at most `maxLength + ellipsis.length`.
 * This matches the Rust side which counts `char` (Unicode scalar values)
 * and appends "…" after the slice.
 *
 * @param text      Source text (frontmatter already stripped).
 * @param maxLength Maximum character count before truncation fires.
 * @param ellipsis  Suffix appended on truncation.
 * @returns         Truncated (or original) string.
 */
export function truncatePreview(
  text: string,
  maxLength: number,
  ellipsis: string = TRUNCATION_ELLIPSIS,
): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Use Array.from to correctly handle surrogate pairs.
  const codePoints = Array.from(text);
  if (codePoints.length <= maxLength) {
    return text;
  }

  let sliced = codePoints.slice(0, maxLength);

  // Try to break at a word boundary within the last 20 % of the slice.
  const lookback = Math.max(1, Math.floor(maxLength * 0.2));
  const tail = sliced.slice(maxLength - lookback);
  const lastSpace = findLastWhitespace(tail);
  if (lastSpace !== -1) {
    sliced = sliced.slice(0, maxLength - lookback + lastSpace);
  }

  return sliced.join("") + ellipsis;
}

/**
 * Returns the index of the last whitespace character in `chars`,
 * or -1 if none is found.
 */
function findLastWhitespace(chars: string[]): number {
  for (let i = chars.length - 1; i >= 0; i--) {
    if (/\s/.test(chars[i])) {
      return i;
    }
  }
  return -1;
}
