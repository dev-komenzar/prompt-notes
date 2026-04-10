import { listNotes, searchNotes, deleteNote } from '../api';
import { getDefaultDateRange } from '../utils/date-utils';
import type { NoteEntry, ListNotesParams, SearchNotesParams } from '../types';

interface NotesState {
  notes: NoteEntry[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  selectedTags: string[];
}

const defaultRange = getDefaultDateRange();

let state = $state<NotesState>({
  notes: [],
  loading: false,
  error: null,
  searchQuery: '',
  dateFrom: defaultRange.from,
  dateTo: defaultRange.to,
  selectedTags: []
});

export function getNotesState() {
  return state;
}

export async function loadNotes(): Promise<void> {
  state.loading = true;
  state.error = null;
  try {
    const params: ListNotesParams = {
      date_from: state.dateFrom || undefined,
      date_to: state.dateTo || undefined,
      tags: state.selectedTags.length > 0 ? state.selectedTags : undefined
    };
    state.notes = await listNotes(params);
  } catch (e) {
    state.error = e instanceof Error ? e.message : String(e);
  } finally {
    state.loading = false;
  }
}

export async function performSearch(): Promise<void> {
  if (!state.searchQuery.trim()) {
    await loadNotes();
    return;
  }

  state.loading = true;
  state.error = null;
  try {
    const params: SearchNotesParams = {
      query: state.searchQuery,
      date_from: state.dateFrom || undefined,
      date_to: state.dateTo || undefined,
      tags: state.selectedTags.length > 0 ? state.selectedTags : undefined
    };
    state.notes = await searchNotes(params);
  } catch (e) {
    state.error = e instanceof Error ? e.message : String(e);
  } finally {
    state.loading = false;
  }
}

export async function removeNote(filename: string): Promise<void> {
  await deleteNote(filename);
  state.notes = state.notes.filter((n) => n.filename !== filename);
}

export function setSearchQuery(query: string) {
  state.searchQuery = query;
}

export function setDateRange(from: string, to: string) {
  state.dateFrom = from;
  state.dateTo = to;
}

export function setSelectedTags(tags: string[]) {
  state.selectedTags = tags;
}

export function resetFilters() {
  const range = getDefaultDateRange();
  state.searchQuery = '';
  state.dateFrom = range.from;
  state.dateTo = range.to;
  state.selectedTags = [];
}
