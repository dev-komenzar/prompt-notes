// Sprint 2/14/24 – Canonical type definitions mirroring Rust backend
// All IPC boundary types consolidated here

/** Represents a single note entry returned from the backend */
export interface NoteEntry {
  /** Filename without path, e.g. "2025-01-15T143022.md" */
  filename: string;
  /** Full file path */
  path: string;
  /** ISO-8601 created timestamp derived from filename */
  created_at: string;
  /** ISO-8601 last-modified timestamp from filesystem */
  modified_at: string;
  /** Extracted tags from YAML frontmatter */
  tags: string[];
  /** First non-frontmatter line used as preview/title */
  title: string;
  /** Preview body text (first ~200 chars of body) */
  preview: string;
  /** File size in bytes */
  size: number;
}

/** Result of creating a new note */
export interface CreateNoteResult {
  filename: string;
  path: string;
}

/** Parameters for listing notes */
export interface ListNotesParams {
  /** ISO-8601 date string for range start (inclusive) */
  from?: string;
  /** ISO-8601 date string for range end (inclusive) */
  to?: string;
  /** Filter by tags (AND logic) */
  tags?: string[];
  /** Sort field */
  sort_by?: "created" | "modified";
  /** Sort direction */
  sort_order?: "asc" | "desc";
}

/** Parameters for searching notes */
export interface SearchNotesParams {
  query: string;
  from?: string;
  to?: string;
  tags?: string[];
}

/** Application configuration */
export interface Config {
  /** Root directory where .md files are stored */
  notes_directory: string;
  /** Default number of days to show in grid view */
  default_filter_days: number;
}

/** Toast notification types */
export type ToastLevel = "info" | "success" | "warning" | "error";

export interface ToastMessage {
  id: number;
  level: ToastLevel;
  message: string;
  timeout: number;
}

/** View names for SPA routing */
export type ViewName = "editor" | "grid" | "settings";
