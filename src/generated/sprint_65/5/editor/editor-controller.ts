// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 65-1
// @task-title: 5 週
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// @codd-sprint: 65 | task: 65-1 | module: editor
// Orchestrates CodeMirror 6 lifecycle, new-note creation, auto-save, and copy.
// Title input is forbidden (RBC-2). Markdown preview is forbidden (RBC-2).

import type { EditorView as CM6EditorView } from '@codemirror/view';
import { createNote, readNote } from '../ipc';
import { AutoSavePipeline } from './autosave';
import { parseFrontmatterAndBody, extractBodyForCopy } from './frontmatter';
import { copyBodyToClipboard } from './clipboard';
import { buildEditorExtensions, createEditorState } from './codemirror-setup';
import type { CopyStatus, SaveStatus, NoteMetadata } from '../types';

export class EditorController {
  private view: CM6EditorView | null = null;
  private currentNoteId: string | null = null;
  private currentTags: string[] = [];
  private autosave: AutoSavePipeline;

  constructor(
    private readonly onSaveStatus: (s: SaveStatus) => void,
    private readonly onCopyStatus: (s: CopyStatus) => void,
    private readonly onNoteCreated: (meta: NoteMetadata) => void,
    private readonly onTagsChange: (tags: string[]) => void
  ) {
    this.autosave = new AutoSavePipeline(onSaveStatus);
  }

  /** Call once when mounting the editor container element. */
  mount(container: HTMLElement): void {
    const { EditorView } = require('@codemirror/view');
    const extensions = buildEditorExtensions(() => this.handleDocChanged());
    const state = createEditorState('', extensions);
    this.view = new EditorView({ state, parent: container });
  }

  destroy(): void {
    this.autosave.cancel();
    this.view?.destroy();
    this.view = null;
  }

  /** Load an existing note into the editor. */
  async loadNote(id: string): Promise<void> {
    const note = await readNote(id);
    this.currentNoteId = id;
    this.currentTags = note.metadata.tags;
    this.onTagsChange(this.currentTags);
    this.setDoc(note.body);
  }

  /** Create a new note and switch editor to it. Latency target: <100ms (RB-1). */
  async createNewNote(): Promise<void> {
    const meta = await createNote();
    this.currentNoteId = meta.id;
    this.currentTags = [];
    this.onTagsChange([]);
    this.setDoc('');
    this.view?.focus();
    this.onNoteCreated(meta);
  }

  /** Called when tags change in FrontmatterBar. Triggers auto-save. */
  updateTags(tags: string[]): void {
    this.currentTags = tags;
    this.scheduleAutosave();
  }

  /** Copies body (without frontmatter) to clipboard (RB-1). */
  async copyToClipboard(): Promise<void> {
    const body = this.getBody();
    await copyBodyToClipboard(body, this.onCopyStatus);
  }

  private handleDocChanged(): void {
    this.scheduleAutosave();
  }

  private scheduleAutosave(): void {
    if (!this.currentNoteId) return;
    const body = this.getBody();
    this.autosave.schedule(this.currentNoteId, this.currentTags, body);
  }

  private getBody(): string {
    if (!this.view) return '';
    return this.view.state.doc.toString();
  }

  private setDoc(content: string): void {
    if (!this.view) return;
    const { EditorView } = require('@codemirror/view');
    this.view.dispatch({
      changes: { from: 0, to: this.view.state.doc.length, insert: content },
    });
  }

  getBodyForCopy(): string {
    return this.getBody();
  }

  focusEditor(): void {
    this.view?.focus();
  }
}
