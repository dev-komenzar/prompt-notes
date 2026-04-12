<!-- @generated-from: docs/detailed_design/editor_clipboard_design.md -->
<!-- @sprint: 22 — 自動保存パイプライン実装 -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView as CMEditorView, keymap, lineWrapping } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
  import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
  import { createNote, saveNote, readNote, listNotes } from '$lib/ipc';
  import type { NoteMetadata, Note } from '$lib/types';
  import { notesStore } from '$stores/notes';
  import NoteList from './NoteList.svelte';
  import FrontmatterBar from './FrontmatterBar.svelte';
  import CopyButton from './CopyButton.svelte';

  // ─── State ────────────────────────────────────────────────────────────────
  let editorView: CMEditorView;
  let editorContainer: HTMLDivElement;
  let currentNoteId: string | null = null;
  let currentTags: string[] = [];

  // Auto-save debounce
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  // Error banner
  let errorMessage: string | null = null;
  let errorTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Error display ────────────────────────────────────────────────────────
  function showError(msg: string) {
    errorMessage = msg;
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => { errorMessage = null; }, 3000);
  }

  // ─── Auto-save pipeline ───────────────────────────────────────────────────
  // updateListener (CodeMirror) → debouncedSave() → saveNote() [IPC]
  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      if (!currentNoteId || !editorView) return;
      const body = editorView.state.doc.toString();
      await saveWithRetry(currentNoteId, currentTags, body);
    }, 500);
  }

  async function saveWithRetry(id: string, tags: string[], body: string, attempt = 0): Promise<void> {
    try {
      await saveNote(id, { tags }, body);
    } catch (err) {
      if (attempt < 2) {
        await new Promise<void>(r => setTimeout(r, 3000));
        return saveWithRetry(id, tags, body, attempt + 1);
      }
      showError('保存に失敗しました。ディスクの空き容量やパーミッションを確認してください。');
      console.error('[EditorView] save_note failed after 3 attempts:', err);
    }
  }

  // ─── Tag change (FrontmatterBar → debouncedSave pipeline) ─────────────────
  function handleTagsChange(tags: string[]) {
    currentTags = tags;
    debouncedSave();
  }

  // ─── Note selection ───────────────────────────────────────────────────────
  async function handleNoteSelect(note: NoteMetadata) {
    try {
      const full: Note = await readNote(note.id);
      currentNoteId = full.metadata.id;
      currentTags = full.metadata.tags;
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: full.body }
      });
      editorView.focus();
    } catch (err) {
      showError('ノートの読み込みに失敗しました。');
      console.error('[EditorView] read_note failed:', err);
    }
  }

  // ─── New note (Cmd+N / Ctrl+N) ────────────────────────────────────────────
  async function handleCreateNote() {
    try {
      const metadata = await createNote();
      currentNoteId = metadata.id;
      currentTags = [];
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: '' }
      });
      editorView.focus();
      await refreshNoteList();
    } catch (err) {
      showError('新規ノートの作成に失敗しました。');
      console.error('[EditorView] create_note failed:', err);
    }
  }

  async function refreshNoteList() {
    try {
      const notes = await listNotes();
      notesStore.set(notes);
    } catch (err) {
      console.error('[EditorView] list_notes failed:', err);
    }
  }

  // ─── Global keydown: Cmd+N (macOS) / Ctrl+N (Linux) ──────────────────────
  function handleGlobalKeydown(e: KeyboardEvent) {
    const isMac = navigator.platform.startsWith('Mac');
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    if (modifier && e.key === 'n') {
      e.preventDefault();
      handleCreateNote();
    }
  }

  // ─── Content accessor for CopyButton ──────────────────────────────────────
  function getEditorContent(): string {
    if (!editorView) return '';
    return editorView.state.doc.toString();
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  onMount(async () => {
    const state = EditorState.create({
      doc: '',
      extensions: [
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        lineWrapping,
        // Auto-save pipeline: docChanged → debouncedSave() → saveNote()
        CMEditorView.updateListener.of((update) => {
          if (update.docChanged) {
            debouncedSave();
          }
        }),
        CMEditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': { fontFamily: 'monospace', padding: '16px' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });

    editorView = new CMEditorView({ state, parent: editorContainer });
    window.addEventListener('keydown', handleGlobalKeydown);

    await refreshNoteList();
    // Open a blank note on first load
    await handleCreateNote();
  });

  onDestroy(() => {
    if (saveTimer) clearTimeout(saveTimer);
    if (errorTimer) clearTimeout(errorTimer);
    window.removeEventListener('keydown', handleGlobalKeydown);
    editorView?.destroy();
  });
</script>

<div class="editor-layout">
  <aside class="note-list-sidebar">
    <NoteList onSelect={handleNoteSelect} />
  </aside>

  <main class="editor-main">
    {#if errorMessage}
      <div class="error-banner" role="alert">{errorMessage}</div>
    {/if}

    <FrontmatterBar tags={currentTags} onTagsChange={handleTagsChange} />

    <div class="editor-container" bind:this={editorContainer}></div>

    <CopyButton getContent={getEditorContent} />
  </main>
</div>

<style>
  .editor-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .note-list-sidebar {
    width: 240px;
    flex-shrink: 0;
    border-right: 1px solid #e2e8f0;
    overflow-y: auto;
    background: #f7fafc;
  }

  .editor-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }

  .editor-container {
    flex: 1;
    overflow: hidden;
  }

  .error-banner {
    background: #fed7d7;
    color: #c53030;
    padding: 8px 16px;
    font-size: 13px;
    border-bottom: 1px solid #fc8181;
    flex-shrink: 0;
  }
</style>
