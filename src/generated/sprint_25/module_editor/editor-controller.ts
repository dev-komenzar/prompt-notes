// @generated-by: codd implement
// @generated-from: docs/plan/implementation_plan.md (plan:implementation_plan)
// @task-id: 25-1
// @task-title: `module:editor`
// @generated-from: docs/design/system_design.md (design:system-design)
// @generated-from: docs/detailed_design/component_architecture.md (detail:component_architecture)
// @generated-from: docs/detailed_design/editor_clipboard_design.md (detail:editor_clipboard)
// @generated-from: docs/detailed_design/grid_search_design.md (detail:grid_search)
// @generated-from: docs/detailed_design/storage_fileformat_design.md (detail:storage_fileformat)
// @generated-from: docs/governance/adr_tech_stack.md (governance:adr_tech_stack)
// @generated-from: docs/requirements/requirements.md (req:promptnotes-requirements)
// @generated-from: docs/test/acceptance_criteria.md (test:acceptance_criteria)

// sprint:25 task:25-1 module:editor – EditorView lifecycle management
// Owns the CM6 EditorView instance, wires IPC calls, manages auto-save debounce.
// CONV-3: All file ops go through Rust backend via api.ts IPC wrappers.
// CONV-7: Exposes getBodyText() for 1-click copy button.
// CONV-8: Mod-n handler creates note via IPC, replaces doc, focuses editor.
// CONV-11: Auto-save via 500ms debounced updateListener.

import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';

import { createNote, saveNote, readNote } from './api';
import { debounce, type DebouncedFunction } from './debounce';
import {
  FRONTMATTER_TEMPLATE,
  extractBody,
  findBodyStartPosition,
} from './frontmatter-utils';
import { createEditorExtensions } from './editor-extensions';
import type { Extension } from '@codemirror/state';

const AUTO_SAVE_DEBOUNCE_MS = 500;

export interface EditorControllerConfig {
  /** DOM element to mount the CodeMirror editor into. */
  parent: HTMLElement;
  /** Called when the active filename changes (new note or note load). */
  onFilenameChange?: (filename: string | null) => void;
  /** Called when an auto-save IPC call fails. */
  onSaveError?: (error: unknown) => void;
}

export class EditorController {
  private view: EditorView;
  private extensions: Extension[];
  private currentFilename: string | null = null;
  private debouncedSave: DebouncedFunction<
    (filename: string, content: string) => Promise<void>
  >;
  private onFilenameChange?: (filename: string | null) => void;
  private onSaveError?: (error: unknown) => void;

  constructor(config: EditorControllerConfig) {
    this.onFilenameChange = config.onFilenameChange;
    this.onSaveError = config.onSaveError;

    this.debouncedSave = debounce(
      async (filename: string, content: string) => {
        try {
          await saveNote(filename, content);
        } catch (err: unknown) {
          this.onSaveError?.(err);
        }
      },
      AUTO_SAVE_DEBOUNCE_MS,
    );

    this.extensions = createEditorExtensions({
      getFilename: () => this.currentFilename,
      onDocChanged: (filename, content) => {
        this.debouncedSave(filename, content);
      },
      onCreateNote: () => {
        void this.handleCreateNote();
      },
    });

    this.view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: this.extensions,
      }),
      parent: config.parent,
    });
  }

  private async handleCreateNote(): Promise<void> {
    await this.flushSave();
    const result = await createNote();
    this.currentFilename = result.filename;
    this.onFilenameChange?.(result.filename);

    const template = FRONTMATTER_TEMPLATE;
    this.view.setState(
      EditorState.create({
        doc: template,
        extensions: this.extensions,
        selection: { anchor: template.length },
      }),
    );
    this.view.focus();
  }

  async loadNote(filename: string): Promise<void> {
    await this.flushSave();
    const { content } = await readNote(filename);
    this.currentFilename = filename;
    this.onFilenameChange?.(filename);

    const cursorPos = findBodyStartPosition(content);
    this.view.setState(
      EditorState.create({
        doc: content,
        extensions: this.extensions,
        selection: { anchor: cursorPos },
      }),
    );
    this.view.focus();
  }

  getContent(): string {
    return this.view.state.doc.toString();
  }

  getBodyText(): string {
    return extractBody(this.view.state.doc.toString());
  }

  getFilename(): string | null {
    return this.currentFilename;
  }

  getView(): EditorView {
    return this.view;
  }

  async flushSave(): Promise<void> {
    await this.debouncedSave.flush();
  }

  destroy(): void {
    this.debouncedSave.flush();
    this.view.destroy();
  }
}
