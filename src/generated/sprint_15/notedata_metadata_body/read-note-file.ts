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
// @description: ファイル読み込み → frontmatter/本文分離 → NoteData { metadata, body } 返却

import type { NoteData } from '../frontmatter/types';
import { readNoteFromContent, isValidNoteFilename } from '../frontmatter';

/**
 * Error thrown when a note file cannot be read or parsed.
 */
export class NoteReadError extends Error {
  public readonly code: NoteReadErrorCode;
  public readonly filename: string;

  constructor(code: NoteReadErrorCode, filename: string, message: string) {
    super(message);
    this.name = 'NoteReadError';
    this.code = code;
    this.filename = filename;
  }
}

export type NoteReadErrorCode =
  | 'INVALID_FILENAME'
  | 'FILE_NOT_FOUND'
  | 'READ_ERROR'
  | 'PARSE_ERROR';

/**
 * Reads a note file's raw content and returns a structured NoteData object.
 *
 * This function is a pure TypeScript utility that accepts file content as a string
 * (obtained via Tauri IPC `read_note` or other means) along with the filename,
 * validates the filename format, parses frontmatter/body separation, and returns
 * NoteData { metadata, body }.
 *
 * All file I/O MUST go through Rust backend via Tauri IPC. This function does NOT
 * access the filesystem directly.
 *
 * @param filename - The note filename in YYYY-MM-DDTHHMMSS.md format.
 * @param content - The raw file content as a string.
 * @returns NoteData with separated metadata and body.
 * @throws NoteReadError if filename is invalid or content cannot be parsed.
 */
export function readNoteFile(filename: string, content: string): NoteData {
  if (!isValidNoteFilename(filename)) {
    throw new NoteReadError(
      'INVALID_FILENAME',
      filename,
      `Invalid note filename format: "${filename}". Expected YYYY-MM-DDTHHMMSS.md`
    );
  }

  try {
    return readNoteFromContent(filename, content);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new NoteReadError(
      'PARSE_ERROR',
      filename,
      `Failed to parse note "${filename}": ${message}`
    );
  }
}

/**
 * Processes the raw response from Tauri IPC `read_note` command and returns NoteData.
 *
 * The Tauri `read_note` command returns `{ frontmatter: { tags: string[] }, body: string }`.
 * This function converts that IPC response shape into the internal NoteData structure
 * used throughout the frontend.
 *
 * @param filename - The note filename in YYYY-MM-DDTHHMMSS.md format.
 * @param ipcResponse - The response object from invoking the `read_note` Tauri command.
 * @returns NoteData with metadata derived from filename and IPC response.
 * @throws NoteReadError if filename is invalid.
 */
export function readNoteFromIpcResponse(
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

  const { parseCreatedAtFromFilename } = require('../frontmatter');
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

/**
 * Shape of the Tauri IPC `read_note` command response.
 * Mirrors the Rust backend's return type for the `read_note` command.
 */
export interface ReadNoteIpcResponse {
  frontmatter: {
    tags: string[];
  };
  body: string;
}

/**
 * Extracts a preview string from the note body for display in grid cards.
 * Preview length matches the body_preview convention used in NoteMetadata.
 *
 * @param body - The full note body text.
 * @param maxLength - Maximum preview length in characters (default: 200).
 * @returns Trimmed preview string.
 */
export function extractBodyPreview(body: string, maxLength: number = 200): string {
  const trimmed = body.trimStart();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.slice(0, maxLength);
}
