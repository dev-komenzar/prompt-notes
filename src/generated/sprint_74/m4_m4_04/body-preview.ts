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
// Traceability: detail:storage_fileformat §4.3, detail:grid_search §1.2, §4.3

import {
  BODY_PREVIEW_MAX_LENGTH,
  BODY_PREVIEW_MIN_LENGTH,
  TRUNCATION_ELLIPSIS,
} from "./constants";
import type { BodyPreviewConfig } from "./types";
import { stripFrontmatter } from "./frontmatter";
import { truncatePreview } from "./truncate";

/**
 * Default configuration for body preview extraction.
 */
const DEFAULT_CONFIG: BodyPreviewConfig = {
  maxLength: BODY_PREVIEW_MAX_LENGTH,
  ellipsis: TRUNCATION_ELLIPSIS,
} as const;

/**
 * Extracts a body preview from raw Markdown file content.
 *
 * Processing pipeline:
 *  1. Strip YAML frontmatter (--- delimited block).
 *  2. Collapse leading whitespace (trim start).
 *  3. Truncate to `config.maxLength` characters with ellipsis.
 *
 * This is a **reference implementation** on the TypeScript side that
 * mirrors the Rust `module:storage` behaviour.  In production the
 * `NoteEntry.body_preview` field is generated server-side (Rust); this
 * function exists for:
 *   - Optimistic UI (show preview before IPC round-trip completes)
 *   - Testing / validation of backend output
 *   - Storybook / component development without a running Tauri shell
 *
 * @param content  Full `.md` file content including frontmatter.
 * @param config   Optional override for maxLength / ellipsis.
 * @returns        Truncated body preview string.
 */
export function extractBodyPreview(
  content: string,
  config: Partial<BodyPreviewConfig> = {},
): string {
  const { maxLength, ellipsis } = { ...DEFAULT_CONFIG, ...config };

  const body = stripFrontmatter(content).trimStart();

  if (body.length < BODY_PREVIEW_MIN_LENGTH) {
    return body;
  }

  return truncatePreview(body, maxLength, ellipsis);
}

/**
 * Validates that a `body_preview` value conforms to the 200-char limit.
 *
 * Useful for asserting backend contract compliance in integration tests.
 *
 * @param preview  The `NoteEntry.body_preview` string to validate.
 * @param config   Optional override for maxLength / ellipsis.
 * @returns        `true` when the preview respects the configured limit.
 */
export function isValidBodyPreview(
  preview: string,
  config: Partial<BodyPreviewConfig> = {},
): boolean {
  const { maxLength, ellipsis } = { ...DEFAULT_CONFIG, ...config };

  if (preview.length === 0) {
    return true; // Empty note ⇒ empty preview is valid.
  }

  // The preview may contain up to maxLength content chars + ellipsis.
  const upperBound = maxLength + ellipsis.length;
  return Array.from(preview).length <= upperBound;
}

/**
 * Returns the effective maximum display length of a body preview
 * including the potential ellipsis suffix.
 */
export function bodyPreviewDisplayLength(
  config: Partial<BodyPreviewConfig> = {},
): number {
  const { maxLength, ellipsis } = { ...DEFAULT_CONFIG, ...config };
  return maxLength + ellipsis.length;
}
