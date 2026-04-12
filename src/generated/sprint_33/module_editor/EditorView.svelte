<script lang="ts">
  // @generated-from: docs/detailed_design/editor_clipboard_design.md
  // Sprint 33 performance targets enforced via perfMark / perfMeasure:
  //   cm6-init          ≤ 200 ms
  //   new-note-creation ≤ 100 ms

  import { onMount, onDestroy } from 'svelte';
  import {
    EditorView as CMView,
    keymap,
    lineWrapping,
  } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import {
    syntaxHighlighting,
    defaultHighlightStyle,
  } from '@codemirror/language';
  import {
    history,
    historyKeymap,
    defaultKeymap,
  } from '@codemirror/commands';

  import { createNote, readNote, listNotes, deleteNote, saveNote } from './ipc';
  import { notesStore } from './stores/notes';
  import { perfMark, perfMeasure } from './perf';
  import type { NoteMetadata, Note } from './types';

  import NoteList from './NoteList.svelte';
  import FrontmatterBar from './FrontmatterBar.svelte';
  import CopyButton from './CopyButton.svelte';

  // ── DOM refs ──────────────────────────────────────────────────────────────
  let editorContainer: HTMLDivElement;

  // ── Editor state ──────────────────────────────────────────────────────────
  let cmView: CMView | null = null;
  let currentNoteId: string | null = null;
  let currentTags: string[] = [];
  let selectedNoteId: string | null = null;

  // ── Auto-save pipeline ────────────────────────────────────────────────────
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const SAVE_DEBOUNCE_MS = 500;
  const MAX_SAVE_RETRIES = 3;

  // ── Error display ─────────────────────────────────────────────────────────
  let errorMsg: string | null = null;

  function showError(msg: string, ms = 3000): void {
    errorMsg = msg;
    setTimeout(() => { errorMsg = null; }, ms);
  }

  // ── Content helpers ───────────────────────────────────────────────────────
  // Called by CopyButton — returns body text only (no frontmatter YAML).
  // Since this editor stores body-only in CM6, no stripping needed.
  function getContent(): string {
    return cmView?.state.doc.toString() ?? '';
  }

  // ── Auto-save ─────────────────────────────────────────────────────────────
  function debouncedSave(): void {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => runSave(0), SAVE_DEBOUNCE_MS);
  }

  async function runSave(attempt: number): Promise<void> {
    if (!currentNoteId || !cmView) return;
    const body = cmView.state.doc.toString();
    try {
      await saveNote(currentNoteId, { tags: currentTags }, body);
    } catch {
      if (attempt < MAX_SAVE_RETRIES - 1) {
        setTimeout(() => runSave(attempt + 1), 3000);
      } else {
        showError('自動保存に失敗しました');
      }
    }
  }

  // ── New note (Cmd+N / Ctrl+N) — target ≤ 100 ms ──────────────────────────
  async function handleCreateNote(): Promise<void> {
    perfMark('new-note-start');
    try {
      const meta = await createNote();
      currentNoteId = meta.id;
      currentTags = [];
      selectedNoteId = meta.id;

      if (cmView) {
        cmView.dispatch({
          changes: { from: 0, to: cmView.state.doc.length, insert: '' },
        });
        cmView.focus();
      }

      perfMeasure('new-note-start', 'new-note-end', 'new-note-creation');

      const notes = await listNotes();
      notesStore.set(notes);
    } catch {
      showError('新規ノートの作成に失敗しました');
    }
  }

  // ── Select / load an existing note ───────────────────────────────────────
  async function handleSelectNote(meta: NoteMetadata): Promise<void> {
    try {
      const note: Note = await readNote(meta.id);
      currentNoteId = note.id;
      currentTags = note.frontmatter.tags;
      selectedNoteId = note.id;

      if (cmView) {
        cmView.dispatch({
          changes: { from: 0, to: cmView.state.doc.length, insert: note.body },
        });
        cmView.focus();
      }
    } catch {
      showError('ノートの読み込みに失敗しました');
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDeleteNote(meta: NoteMetadata): Promise<void> {
    try {
      await deleteNote(meta.id);
      if (currentNoteId === meta.id) {
        currentNoteId = null;
        currentTags = [];
        selectedNoteId = null;
        if (cmView) {
          cmView.dispatch({
            changes: { from: 0, to: cmView.state.doc.length, insert: '' },
          });
        }
      }
      const notes = await listNotes();
      notesStore.set(notes);
    } catch {
      showError('ノートの削除に失敗しました');
    }
  }

  // ── Tag change from FrontmatterBar ────────────────────────────────────────
  function handleTagsChange(tags: string[]): void {
    currentTags = tags;
    debouncedSave();
  }

  // ── Global Cmd+N / Ctrl+N ─────────────────────────────────────────────────
  function handleGlobalKeydown(e: KeyboardEvent): void {
    const isMac = /Mac/i.test(navigator.platform);
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && e.key === 'n') {
      e.preventDefault();
      handleCreateNote();
    }
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  onMount(async () => {
    // Measure CodeMirror 6 initialisation — target ≤ 200 ms
    perfMark('cm6-init-start');

    const state = EditorState.create({
      doc: '',
      extensions: [
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        lineWrapping,
        CMView.updateListener.of((update) => {
          if (update.docChanged) debouncedSave();
        }),
        CMView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': {
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            padding: '16px',
          },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-focused': { outline: 'none' },
        }),
      ],
    });

    cmView = new CMView({ state, parent: editorContainer });

    perfMeasure('cm6-init-start', 'cm6-init-end', 'cm6-init');

    window.addEventListener('keydown', handleGlobalKeydown);

    try {
      const notes = await listNotes();
      notesStore.set(notes);
      if (notes.length > 0) {
        await handleSelectNote(notes[0]);
      } else {
        await handleCreateNote();
      }
    } catch (e) {
      console.error('[EditorView] Failed to load initial notes:', e);
    }
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleGlobalKeydown);
    if (saveTimer) clearTimeout(saveTimer);
    cmView?.destroy();
  });
</script>

<div class="editor-layout">
  <!-- Left sidebar: past notes list (navigable, selectable for editing) -->
  <aside class="note-list-pane">
    <NoteList
      {selectedNoteId}
      on:select={(e) => handleSelectNote(e.detail)}
      on:delete={(e) => handleDeleteNote(e.detail)}
    />
  </aside>

  <!-- Right: frontmatter region + CodeMirror body editor -->
  <div class="editor-pane">
    {#if errorMsg}
      <div class="error-banner" role="alert">{errorMsg}</div>
    {/if}

    <!--
      FrontmatterBar IS the "frontmatter region" — background colour
      distinguishes it from the body editor below. (AC-EDIT-01, FC-EDIT-07)
      No title input is present. (RB-2)
    -->
    <FrontmatterBar
      tags={currentTags}
      on:change={(e) => handleTagsChange(e.detail)}
    />

    <!-- CodeMirror 6 host — body text only, Markdown syntax highlight. No preview. (RB-2) -->
    <div class="cm-host" bind:this={editorContainer}></div>

    <!-- 1-click copy button — core UX, release-blocking (RB-1) -->
    <CopyButton {getContent} />
  </div>
</div>

<style>
  .editor-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--bg, #ffffff);
    color: var(--text, #1a202c);
  }

  .note-list-pane {
    width: 240px;
    flex-shrink: 0;
    border-right: 1px solid var(--border, #e2e8f0);
    overflow-y: auto;
    background: var(--sidebar-bg, #f7fafc);
  }

  .editor-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .cm-host {
    flex: 1;
    overflow: hidden;
  }

  .error-banner {
    flex-shrink: 0;
    background: #fed7d7;
    color: #c53030;
    padding: 8px 16px;
    font-size: 13px;
    text-align: center;
  }

  :global(.cm-editor) {
    height: 100%;
  }
</style>
