// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 18-2
// @task-title: `YYYY-MM-DDTHHMMSS.md` 形式チェック）→ frontmatter パース → `NoteMetadata[]` を `created_at` 降順で返却。`body_preview` は本文先頭 200 文字。
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @traceability sprint:18 task:18-2
// Deliverable: directory scan → .md only (exclude .tmp, validate YYYY-MM-DDTHHMMSS.md)
//              → frontmatter parse → NoteMetadata[] sorted by created_at desc
//              → body_preview = first 200 chars of body

import * as fs from 'fs';
import * as path from 'path';
import { isMdFile, isTmpFile, isValidNoteFilename } from '../md_tmp/filename';
import { processNoteFiles } from '../md_tmp/list_notes';
import type { NoteFile, NoteMetadata } from '../md_tmp/types';

export function scanNoteFiles(notesDir: string): NoteFile[] {
  const entries = fs.readdirSync(notesDir, { withFileTypes: true });
  const noteFiles: NoteFile[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filename = entry.name;
    if (!isMdFile(filename)) continue;
    if (isTmpFile(filename)) continue;
    if (!isValidNoteFilename(filename)) continue;

    const fullPath = path.join(notesDir, filename);
    const content = fs.readFileSync(fullPath, 'utf-8');
    noteFiles.push({ filename, content });
  }

  return noteFiles;
}

export function listNotes(notesDir: string): NoteMetadata[] {
  const noteFiles = scanNoteFiles(notesDir);
  return processNoteFiles(noteFiles);
}
