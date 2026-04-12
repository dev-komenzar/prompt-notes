<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView as CMEditorView, keymap } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
  import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';

  import NoteList from './NoteList.svelte';
  import FrontmatterBar from './FrontmatterBar.svelte';
  import CopyButton from './CopyButton.svelte';
  import { notesStore, selectedNoteId } from './stores/notes';
  import { createNote, readNote, saveNote, listNotes } from './ipc';
  import type { Note } from './types';

  let editorContainer: HTMLDivElement;
  let cmView: CMEditorView;

  let currentNoteId: string | null = null;
  let currentTags: string[] = [];
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let saveRetryCount = 0;

  let errorMessage: string | null = null;
  let errorTimer: ReturnType<typeof setTimeout> | null = null;

  // -------------------------------------------------------
  // Sprint 25: NoteList 選択 → readNote → CM6 document 設定
  // -------------------------------------------------------
  async function handleNoteSelect(id: string) {
    if (id === currentNoteId) {
      cmView?.focus();
      return;
    }

    let note: Note;
    try {
      note = await readNote(id);
    } catch (err) {
      showError('ノートの読み込みに失敗しました');
      return;
    }

    currentNoteId = note.id;
    currentTags = note.frontmatter.tags;
    selectedNoteId.set(note.id);

    // Set CodeMirror 6 document to the note body
    cmView.dispatch({
      changes: {
        from: 0,
        to: cmView.state.doc.length,
        insert: note.body,
      },
    });
    cmView.focus();
  }

  // -------------------------------------------------------
  // Auto-save pipeline (500ms debounce)
  // -------------------------------------------------------
  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => executeSave(), 500);
  }

  async function executeSave(retryCount = 0) {
    if (!currentNoteId) return;
    const body = cmView.state.doc.toString();
    try {
      await saveNote(currentNoteId, { tags: currentTags }, body);
      saveRetryCount = 0;
    } catch (err) {
      if (retryCount < 3) {
        setTimeout(() => executeSave(retryCount + 1), 3000);
      } else {
        showError('自動保存に失敗しました');
        saveRetryCount = 0;
      }
    }
  }

  // -------------------------------------------------------
  // Cmd+N / Ctrl+N — new note creation
  // -------------------------------------------------------
  async function handleCreateNote() {
    try {
      const metadata = await createNote();
      currentNoteId = metadata.id;
      currentTags = [];
      selectedNoteId.set(metadata.id);

      cmView.dispatch({
        changes: {
          from: 0,
          to: cmView.state.doc.length,
          insert: '',
        },
      });
      cmView.focus();

      await refreshNoteList();
    } catch (err) {
      showError('新規ノートの作成に失敗しました');
    }
  }

  async function refreshNoteList() {
    try {
      const notes = await listNotes();
      notesStore.set(notes);
    } catch (err) {
      console.error('Failed to refresh note list:', err);
    }
  }

  // -------------------------------------------------------
  // Tag changes from FrontmatterBar
  // -------------------------------------------------------
  function handleTagsChanged(event: CustomEvent<string[]>) {
    currentTags = event.detail;
    debouncedSave();
  }

  // -------------------------------------------------------
  // Copy button content provider (frontmatter excluded)
  // -------------------------------------------------------
  function getEditorContent(): string {
    return cmView?.state.doc.toString() ?? '';
  }

  // -------------------------------------------------------
  // Global keyboard shortcut
  // -------------------------------------------------------
  function handleGlobalKeydown(e: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    if (modifier && e.key === 'n') {
      e.preventDefault();
      handleCreateNote();
    }
  }

  // -------------------------------------------------------
  // Error display
  // -------------------------------------------------------
  function showError(msg: string) {
    errorMessage = msg;
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      errorMessage = null;
    }, 3000);
  }

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------
  onMount(async () => {
    const state = EditorState.create({
      doc: '',
      extensions: [
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        CMEditorView.lineWrapping,
        CMEditorView.updateListener.of((update) => {
          if (update.docChanged) {
            debouncedSave();
          }
        }),
        CMEditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': {
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            padding: '16px',
          },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-focused': { outline: 'none' },
        }),
      ],
    });

    cmView = new CMEditorView({ state, parent: editorContainer });

    window.addEventListener('keydown', handleGlobalKeydown);

    await refreshNoteList();

    // Handle note opened from grid view (?note=<id>)
    const params = new URLSearchParams(window.location.search);
    const noteId = params.get('note');
    if (noteId) {
      await handleNoteSelect(noteId);
    }
  });

  onDestroy(() => {
    cmView?.destroy();
    window.removeEventListener('keydown', handleGlobalKeydown);
    if (saveTimer) clearTimeout(saveTimer);
    if (errorTimer) clearTimeout(errorTimer);
  });
</script>

<div class="editor-layout">
  <!-- Left sidebar: note list -->
  <aside class="sidebar">
    <NoteList
      on:select={(e) => handleNoteSelect(e.detail)}
      on:create={handleCreateNote}
    />
  </aside>

  <!-- Right: editor area -->
  <main class="editor-main">
    {#if errorMessage}
      <div class="error-banner" role="alert">{errorMessage}</div>
    {/if}

    <!-- Frontmatter region (visually distinct background) -->
    <FrontmatterBar tags={currentTags} on:tagsChanged={handleTagsChanged} />

    <div class="editor-body">
      <div bind:this={editorContainer} class="cm-host"></div>
      <CopyButton {getEditorContent} />
    </div>
  </main>
</div>

<style>
  .editor-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
    background: #fff;
  }

  .sidebar {
    width: 240px;
    flex-shrink: 0;
    border-right: 1px solid #e2e8f0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .editor-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .editor-body {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .cm-host {
    height: 100%;
  }

  .error-banner {
    background: #fed7d7;
    color: #c53030;
    padding: 8px 16px;
    font-size: 13px;
    flex-shrink: 0;
    border-bottom: 1px solid #feb2b2;
  }
</style>
