<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { querystring } from 'svelte-spa-router';
  import { EditorView, keymap, lineWrapping } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
  import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';

  import { notesStore, selectedNoteId } from '../../stores/notes';
  import { createNote, saveNote, readNote, listNotes } from '../../lib/ipc';
  import type { NoteMetadata } from '../../lib/types';

  import FrontmatterBar from './FrontmatterBar.svelte';
  import NoteList from './NoteList.svelte';
  import CopyButton from './CopyButton.svelte';

  let editorContainer: HTMLDivElement;
  let editorView: EditorView | null = null;
  let currentNoteId: string | null = null;
  let currentTags: string[] = [];
  let errorMessage: string | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  $: {
    const params = new URLSearchParams($querystring ?? '');
    const noteId = params.get('note');
    if (noteId && noteId !== currentNoteId && editorView) {
      loadNote(noteId);
    }
  }

  onMount(async () => {
    initEditor();
    window.addEventListener('keydown', handleGlobalKeydown);
    await refreshNoteList();
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleGlobalKeydown);
    if (saveTimer) clearTimeout(saveTimer);
    editorView?.destroy();
  });

  function initEditor() {
    const state = EditorState.create({
      doc: '',
      extensions: [
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) debouncedSave();
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': {
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            padding: '16px',
          },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-editor': { height: '100%' },
          '.cm-focused': { outline: 'none' },
        }),
      ],
    });

    editorView = new EditorView({ state, parent: editorContainer });
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => performSave(0), 500);
  }

  async function performSave(attempt: number) {
    if (!currentNoteId || !editorView) return;
    const body = editorView.state.doc.toString();
    try {
      await saveNote(currentNoteId, { tags: currentTags }, body);
    } catch {
      if (attempt < 3) {
        setTimeout(() => performSave(attempt + 1), 3000);
      } else {
        showError('保存に失敗しました');
      }
    }
  }

  function handleTagChange(event: CustomEvent<string[]>) {
    currentTags = event.detail;
    debouncedSave();
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    if (modifier && e.key === 'n') {
      e.preventDefault();
      handleCreateNote();
    }
  }

  async function handleCreateNote() {
    try {
      const metadata = await createNote();
      currentNoteId = metadata.id;
      currentTags = [];
      if (editorView) {
        editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: '' },
        });
        editorView.focus();
      }
      selectedNoteId.set(metadata.id);
      await refreshNoteList();
    } catch {
      showError('新規ノートの作成に失敗しました');
    }
  }

  async function loadNote(noteId: string) {
    try {
      const note = await readNote(noteId);
      currentNoteId = note.id;
      currentTags = note.frontmatter.tags;
      if (editorView) {
        editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: note.body },
        });
        editorView.focus();
      }
      selectedNoteId.set(noteId);
    } catch {
      showError('ノートの読み込みに失敗しました');
    }
  }

  async function handleSelectNote(event: CustomEvent<string>) {
    await loadNote(event.detail);
  }

  async function refreshNoteList() {
    try {
      const result = await listNotes();
      notesStore.set(result);
    } catch {
      notesStore.set([]);
    }
  }

  function getEditorContent(): string {
    return editorView?.state.doc.toString() ?? '';
  }

  function showError(msg: string) {
    errorMessage = msg;
    setTimeout(() => { errorMessage = null; }, 3000);
  }
</script>

<div class="editor-layout">
  <NoteList
    notes={$notesStore}
    selectedId={currentNoteId}
    on:select={handleSelectNote}
  />

  <div class="editor-area">
    {#if errorMessage}
      <div class="error-banner" role="alert">{errorMessage}</div>
    {/if}

    <FrontmatterBar tags={currentTags} on:change={handleTagChange} />

    <div class="codemirror-wrapper" bind:this={editorContainer}></div>

    <CopyButton getContent={getEditorContent} />
  </div>
</div>

<style>
  .editor-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: var(--bg-color, #ffffff);
  }

  .editor-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    min-width: 0;
  }

  .codemirror-wrapper {
    flex: 1;
    overflow: hidden;
  }

  .error-banner {
    background: #fee2e2;
    color: #dc2626;
    padding: 8px 16px;
    font-size: 13px;
    border-bottom: 1px solid #fecaca;
    flex-shrink: 0;
  }
</style>
