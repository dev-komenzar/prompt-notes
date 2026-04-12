<!-- @generated-from: docs/detailed_design/editor_clipboard_design.md -->
<!-- Sprint 21 — EditorView: CodeMirror 6 ホスト、自動保存、Cmd+N キーバインド -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView as CMEditorView } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { createEditorExtensions } from './editor-extensions';
  import { frontmatterPlugin, frontmatterTheme, extractBody } from './frontmatter-plugin';
  import NoteList from './NoteList.svelte';
  import FrontmatterBar from './FrontmatterBar.svelte';
  import CopyButton from './CopyButton.svelte';
  import { createNote, saveNote, readNote, listNotes } from '$lib/ipc';
  import { notesStore } from '$stores/notes';
  import type { NoteMetadata, Note } from '$lib/types';

  let editorContainer: HTMLDivElement;
  let editorView: CMEditorView;
  let currentNoteId: string | null = null;
  let currentTags: string[] = [];
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let errorMessage: string | null = null;
  let errorTimer: ReturnType<typeof setTimeout> | null = null;
  let saveRetryCount = 0;

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => executeSave(), 500);
  }

  async function executeSave(retryCount = 0): Promise<void> {
    if (!currentNoteId || !editorView) return;
    const body = extractBody(editorView.state.doc.toString());
    try {
      await saveNote(currentNoteId, { tags: currentTags }, body);
      saveRetryCount = 0;
    } catch {
      if (retryCount < 3) {
        setTimeout(() => executeSave(retryCount + 1), 3000);
      } else {
        showError('自動保存に失敗しました（3回リトライ後）');
        saveRetryCount = 0;
      }
    }
  }

  function showError(msg: string) {
    errorMessage = msg;
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => { errorMessage = null; }, 3000);
  }

  function getEditorContent(): string {
    if (!editorView) return '';
    return extractBody(editorView.state.doc.toString());
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
      await refreshNoteList();
    } catch {
      showError('新規ノートの作成に失敗しました');
    }
  }

  async function refreshNoteList() {
    try {
      const notes = await listNotes();
      notesStore.set(notes);
    } catch {
      // サイレントフェイル: NoteList 側で空リスト表示
    }
  }

  async function handleSelectNote(note: NoteMetadata) {
    try {
      const loaded: Note = await readNote(note.id);
      currentNoteId = loaded.id;
      currentTags = loaded.frontmatter.tags;
      if (editorView) {
        const tagsLine =
          currentTags.length > 0 ? `[${currentTags.join(', ')}]` : '[]';
        const content = `---\ntags: ${tagsLine}\n---\n${loaded.body}`;
        editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: content },
        });
        editorView.focus();
      }
    } catch {
      showError('ノートの読み込みに失敗しました');
    }
  }

  function handleTagsChange(tags: string[]) {
    currentTags = tags;
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

  onMount(async () => {
    const extensions = [
      ...createEditorExtensions(debouncedSave),
      frontmatterPlugin,
      frontmatterTheme,
    ];

    const state = EditorState.create({ doc: '', extensions });
    editorView = new CMEditorView({ state, parent: editorContainer });

    window.addEventListener('keydown', handleGlobalKeydown);
    await refreshNoteList();
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleGlobalKeydown);
    if (saveTimer) clearTimeout(saveTimer);
    if (errorTimer) clearTimeout(errorTimer);
    editorView?.destroy();
  });
</script>

{#if errorMessage}
  <div class="error-banner" role="alert">{errorMessage}</div>
{/if}

<div class="editor-layout">
  <aside class="note-list-panel">
    <NoteList onSelect={handleSelectNote} {currentNoteId} />
  </aside>

  <main class="editor-panel">
    <FrontmatterBar tags={currentTags} onTagsChange={handleTagsChange} />
    <div class="editor-container" bind:this={editorContainer}></div>
    <CopyButton getContent={getEditorContent} />
  </main>
</div>

<style>
  :root {
    --frontmatter-bg: #f0f4f8;
    --border-color: #e2e8f0;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --frontmatter-bg: #1e293b;
      --border-color: #2d3748;
    }
  }

  .editor-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .note-list-panel {
    width: 240px;
    flex-shrink: 0;
    overflow-y: auto;
    border-right: 1px solid var(--border-color);
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

  .error-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #fc8181;
    color: white;
    text-align: center;
    padding: 8px 16px;
    font-size: 14px;
    z-index: 1000;
  }
</style>
