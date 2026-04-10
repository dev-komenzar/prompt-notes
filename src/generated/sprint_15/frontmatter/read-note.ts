// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-1
// @task-title: ファイル読み込み → frontmatter
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/detailed_design/storage_fileformat_design.md
// @sprint: 15
// @task: 15-1

import type { NoteData, NoteMetadata } from './types';
import { parseFrontmatter } from './parse-frontmatter';
import { parseCreatedAtFromFilename } from './parse-filename';

const DEFAULT_PREVIEW_LENGTH = 200;

/**
 * Transforms raw file content and filename into a structured NoteData object.
 *
 * This function performs:
 *   1. Frontmatter / body separation
 *   2. Tag extraction from YAML frontmatter
 *   3. created_at derivation from filename (NNC-S1, NNC-S2)
 *   4. body_preview generation (first N characters)
 *
 * @param filename - Note filename in YYYY-MM-DDTHHMMSS.md format
 * @param rawContent - Complete file content including frontmatter
 * @param previewLength - Max characters for body_preview (default 200)
 * @returns Structured NoteData with metadata and body
 */
export function readNoteFromContent(
  filename: string,
  rawContent: string,
  previewLength: number = DEFAULT_PREVIEW_LENGTH,
): NoteData {
  const { frontmatter, body } = parseFrontmatter(rawContent);

  const createdAt = parseCreatedAtFromFilename(filename);

  const metadata: NoteMetadata = {
    filename,
    tags: frontmatter.tags,
    created_at: createdAt ?? '',
    body_preview: body.slice(0, previewLength),
  };

  return { metadata, body };
}
