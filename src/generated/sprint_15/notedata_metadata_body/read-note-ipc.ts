// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 15-2
// @task-title: 本文分離 → `NoteData { metadata, body }` 返却
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @generated-from: docs/plan/implementation_plan.md
// @sprint: 15
// @task: 15-2
// @description: Tauri IPC read_note response → NoteData conversion (static import version)

import type { NoteData } from '../frontmatter/types';
import { parseCreatedAtFromFilename, isValidNoteFilename } from '../frontmatter';
import { type ReadNoteIpcResponse, extractBodyPreview, NoteReadError } from './read-note-file';

/**
 * Converts a Tauri IPC `read_note` response into a NoteData structure.
 *
 * This is the preferred entry point when working with the Tauri IPC layer.
 * The frontend calls `invoke('read_note', { filename })` via `src/lib/api/notes.ts`,
 * and the returned response is passed to this function for conversion into the
 * internal NoteData representation.
 *
 * @param filename - The note filename in YYYY-MM-DDTHHMMSS.md format.
 * @param ipcResponse - The response from the Tauri read_note command.
 * @returns NoteData with metadata and body.
 * @throws NoteReadError if filename is invalid.
 */
export function convertIpcResponseToNoteData(
  filename: string,
  ipcResponse: ReadNoteIpcResponse
): NoteData {
  if (!isValidNoteFilename(filename)) {
    throw new NoteReadError(
      'INVALID_FILENAME',
      filename,
      `Invalid note filename format: "${filename}". Expected YYYY-MM-DDTHHMMSS.md`
    );
  }

  const createdAt = parseCreatedAtFromFilename(filename);

  return {
    metadata: {
      filename,
      tags: ipcResponse.frontmatter?.tags ?? [],
      created_at: createdAt,
      body_preview: extractBodyPreview(ipcResponse.body),
    },
    body: ipcResponse.body,
  };
}
