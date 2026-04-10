export interface NoteEntry {
  filename: string;
  tags: string[];
  body_preview: string;
  created_at: string;
}

export interface Config {
  notes_dir: string;
}

export interface CreateNoteResult {
  filename: string;
}

export interface ReadNoteResult {
  raw: string;
  tags: string[];
  body: string;
}

export interface ListNotesParams {
  date_from?: string;
  date_to?: string;
  tags?: string[];
}

export interface SearchNotesParams {
  query: string;
  date_from?: string;
  date_to?: string;
  tags?: string[];
}
