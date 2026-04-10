// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 18-1
// @task-title: ディレクトリ走査 → `.md` ファイルのみ対象（`.tmp` 除外
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

import type { NoteMetadata } from './types';
import { isValidNoteFilename, isTmpFile, isMdFile, parseCreatedAt } from './filename';
import { parseFrontmatterAndBody } from './frontmatter';

export interface NoteFile {
  filename: string;
  content: string;
}

const BODY_PREVIEW_LENGTH = 200;

export function buildNoteMetadata(file: NoteFile): NoteMetadata | null {
  const { filename, content } = file;

  if (isTmpFile(filename)) return null;
  if (!isMdFile(filename)) return null;
  if (!isValidNoteFilename(filename)) return null;

  const { frontmatter, body } = parseFrontmatterAndBody(content);

  const body_preview = Array.from(body).slice(0, BODY_PREVIEW_LENGTH).join('');

  return {
    filename,
    tags: frontmatter.tags,
    body_preview,
    created_at: parseCreatedAt(filename),
  };
}

export function sortNotesByCreatedAtDesc(notes: NoteMetadata[]): NoteMetadata[] {
  return [...notes].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function processNoteFiles(files: NoteFile[]): NoteMetadata[] {
  const notes: NoteMetadata[] = [];
  for (const file of files) {
    const meta = buildNoteMetadata(file);
    if (meta !== null) {
      notes.push(meta);
    }
  }
  return sortNotesByCreatedAtDesc(notes);
}
