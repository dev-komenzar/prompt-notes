<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { EditorView, keymap, lineWrapping } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
  import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';

  import { createNote, saveNote, readNote, listNotes } from '../../ipc';
  import { notesStore, selectedNoteId } from '../../stores/notes';

  import NoteList from './NoteList.svelte';
  import FrontmatterBar from './FrontmatterBar.svelte';
  import CopyButton from './CopyButton.svelte';

  let editorContainer: HTMLDivElement;
  let cmView: EditorView | undefined;
  let currentNoteId: string | null = null;
  let currentTags: string[] = [];
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let saveErrorRetries = 0;
  let saveError = false;
  let unsubscribeSelected: (() => void) | undefined;

  function getEditorContent(): string {
    return cmView?.state.doc.toString() ?? '';
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      if (!currentNoteId) return;
      try {
        await saveNote(currentNoteId, { tags: currentTags }, getEditorContent());
        saveError = false;
        saveErrorRetries = 0;
      } catch {
        saveErrorRetries++;
        if (saveErrorRetries >= 3) {
          saveError = true;
        } else {
          saveTimer = setTimeout(debouncedSave, 3000);
        }
      }
    }, 500);
  }

  async function loadNote(id: string) {
    if (id === currentNoteId) return;
    try {
      const note = await readNote(id);
      currentNoteId = note.metadata.id;
      currentTags = [...note.metadata.tags];
      if (cmView) {
        cmView.dispatch({
          changes: { from: 0, to: cmView.state.doc.length, insert: note.body },
        });
      }
    } catch (err) {
      console.error('Failed to read note:', err);
    }
  }

  async function handleCreateNote() {
    try {
      const metadata = await createNote();
      currentNoteId = metadata.id;
      currentTags = [];
      if (cmView) {
        cmView.dispatch({
          changes: { from: 0, to: cmView.state.doc.length, insert: '' },
        });
        cmView.focus();
      }
      selectedNoteId.set(metadata.id);
      const all = await listNotes();
      notesStore.set(all);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  }

  async function handleSelectNote(id: string) {
    await loadNote(id);
    selectedNoteId.set(id);
    cmView?.focus();
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    if (modifier && e.key === 'n') {
      e.preventDefault();
      handleCreateNote();
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
        lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            debouncedSave();
          }
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': { fontFamily: 'monospace', padding: '16px' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });

    cmView = new EditorView({ state, parent: editorContainer });
    window.addEventListener('keydown', handleGlobalKeydown);

    const all = await listNotes();
    notesStore.set(all);

    // Handle initial note load from store (grid navigation)
    const preselectedId = get(selectedNoteId);
    if (preselectedId) {
      await loadNote(preselectedId);
    } else if (all.length > 0) {
      await loadNote(all[0].id);
      selectedNoteId.set(all[0].id);
    } else {
      await handleCreateNote();
    }

    cmView?.focus();

    // Subscribe to future selectedNoteId changes (grid→editor navigation)
    let skipFirst = true;
    unsubscribeSelected = selectedNoteId.subscribe((id) => {
      if (skipFirst) {
        skipFirst = false;
        return;
      }
      if (id && id !== currentNoteId) {
        loadNote(id).then(() => cmView?.focus());
      }
    });
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleGlobalKeydown);
    cmView?.destroy();
    if (saveTimer) clearTimeout(saveTimer);
    unsubscribeSelected?.();
  });
</script>

<div class="editor-layout">
  <NoteList
    notes={$notesStore}
    selectedId={$selectedNoteId}
    on:select={(e) => handleSelectNote(e.detail)}
  />
  <div class="editor-main">
    {#if saveError}
      <div class="error-banner">
        保存に失敗しました。ディスクの空き容量を確認してください。
      </div>
    {/if}
    <FrontmatterBar tags={currentTags} on:change={handleTagsChange} />
    <div class="editor-container" bind:this={editorContainer}></div>
    <CopyButton getContent={getEditorContent} />
  </div>
</div>

<style>
  .editor-layout {
    display: flex;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  .editor-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    position: relative;
  }

  .editor-container {
    flex: 1;
    overflow: hidden;
  }

  .error-banner {
    background: #fef2f2;
    color: #dc2626;
    padding: 8px 16px;
    font-size: 13px;
    border-bottom: 1px solid #fecaca;
    flex-shrink: 0;
  }

  :global(.cm-editor) {
    height: 100%;
  }

  :global(.cm-scroller) {
    height: 100% !important;
  }
</style>
