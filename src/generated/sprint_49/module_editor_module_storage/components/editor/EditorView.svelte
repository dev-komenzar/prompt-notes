<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView, keymap } from '@codemirror/view';
  import type { ViewUpdate } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
  import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';

  import NoteList from './NoteList.svelte';
  import FrontmatterBar from './FrontmatterBar.svelte';
  import CopyButton from './CopyButton.svelte';

  import { createNote, saveNote, readNote, deleteNote, listNotes } from '../../lib/ipc';
  import { notesStore, selectedNoteId } from '../../stores/notes';

  let editorContainer: HTMLDivElement;
  let cmView: EditorView;
  let currentNoteId: string | null = null;
  let currentTags: string[] = [];
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let saveRetryCount = 0;
  let statusMessage = '';
  let statusIsError = false;

  function getEditorBody(): string {
    return cmView ? cmView.state.doc.toString() : '';
  }

  function showStatus(msg: string, isError = false) {
    statusMessage = msg;
    statusIsError = isError;
    setTimeout(() => {
      statusMessage = '';
    }, 3000);
  }

  async function persistSave() {
    if (!currentNoteId) return;
    try {
      await saveNote(currentNoteId, { tags: currentTags }, getEditorBody());
      saveRetryCount = 0;
    } catch {
      saveRetryCount++;
      if (saveRetryCount >= 3) {
        showStatus('保存に失敗しました', true);
        saveRetryCount = 0;
      } else {
        saveTimer = setTimeout(persistSave, 3000);
      }
    }
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(persistSave, 500);
  }

  async function handleCreateNote() {
    try {
      const metadata = await createNote();
      currentNoteId = metadata.id;
      currentTags = [];
      cmView.dispatch({
        changes: { from: 0, to: cmView.state.doc.length, insert: '' },
      });
      cmView.focus();
      selectedNoteId.set(metadata.id);
      const notes = await listNotes();
      notesStore.set(notes);
    } catch {
      showStatus('ノートの作成に失敗しました', true);
    }
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    if (modifier && e.key === 'n') {
      e.preventDefault();
      handleCreateNote();
    }
  }

  async function handleNoteSelect(event: CustomEvent<string>) {
    const noteId = event.detail;
    try {
      const note = await readNote(noteId);
      currentNoteId = note.id;
      currentTags = note.frontmatter.tags;
      cmView.dispatch({
        changes: { from: 0, to: cmView.state.doc.length, insert: note.body },
      });
      selectedNoteId.set(noteId);
      cmView.focus();
    } catch {
      showStatus('ノートの読み込みに失敗しました', true);
      selectedNoteId.set(null);
    }
  }

  async function handleNoteDelete(event: CustomEvent<string>) {
    const noteId = event.detail;
    try {
      await deleteNote(noteId);
      if (currentNoteId === noteId) {
        currentNoteId = null;
        currentTags = [];
        cmView.dispatch({
          changes: { from: 0, to: cmView.state.doc.length, insert: '' },
        });
        selectedNoteId.set(null);
      }
      const notes = await listNotes();
      notesStore.set(notes);
    } catch {
      showStatus('ノートの削除に失敗しました', true);
    }
  }

  function handleTagsChange(event: CustomEvent<string[]>) {
    currentTags = event.detail;
    debouncedSave();
  }

  onMount(async () => {
    const state = EditorState.create({
      doc: '',
      extensions: [
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            debouncedSave();
          }
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': {
            fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
            padding: '16px',
          },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-focused': { outline: 'none' },
        }),
      ],
    });

    cmView = new EditorView({ state, parent: editorContainer });
    window.addEventListener('keydown', handleGlobalKeydown);

    try {
      const notes = await listNotes();
      notesStore.set(notes);
    } catch {
      // silent: empty list shown
    }
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleGlobalKeydown);
    if (saveTimer) clearTimeout(saveTimer);
    cmView?.destroy();
  });
</script>

<style>
  :global(:root) {
    --frontmatter-bg: #f0f4f8;
  }

  .editor-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: #fff;
  }

  .note-list-panel {
    width: 240px;
    flex-shrink: 0;
    overflow-y: auto;
    border-right: 1px solid #e2e8f0;
  }

  .editor-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .editor-container {
    flex: 1;
    overflow: hidden;
  }

  .editor-container :global(.cm-editor) {
    height: 100%;
  }

  .status-bar {
    padding: 6px 16px;
    font-size: 12px;
    background: #fffbeb;
    color: #744210;
    border-bottom: 1px solid #f6e05e;
  }

  .status-bar.error {
    background: #fff5f5;
    color: #c53030;
    border-bottom-color: #feb2b2;
  }
</style>

<div class="editor-layout" data-testid="editor-layout">
  <div class="note-list-panel">
    <NoteList on:select={handleNoteSelect} on:delete={handleNoteDelete} />
  </div>
  <div class="editor-panel">
    {#if statusMessage}
      <div class="status-bar" class:error={statusIsError} role="alert">
        {statusMessage}
      </div>
    {/if}
    <FrontmatterBar tags={currentTags} on:change={handleTagsChange} />
    <div class="editor-container" bind:this={editorContainer} data-testid="cm-editor-host" />
    <CopyButton getContent={getEditorBody} />
  </div>
</div>
