<script lang="ts">
  // @generated-from: docs/detailed_design/editor_clipboard_design.md
  // Sprint 43: readNote(id) when ?note={id} query param is present
  import { onMount, onDestroy } from 'svelte';
  import { querystring } from 'svelte-spa-router';
  import { EditorView, keymap, lineWrapping } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
  import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
  import { ViewPlugin, Decoration } from '@codemirror/view';
  import type { DecorationSet, ViewUpdate } from '@codemirror/view';
  import type { Note, NoteMetadata } from '$lib/types';
  import { createNote, readNote, saveNote, listNotes } from '$lib/ipc';
  import { notesStore } from '$stores/notes';
  import NoteList from './NoteList.svelte';
  import FrontmatterBar from './FrontmatterBar.svelte';
  import CopyButton from './CopyButton.svelte';

  let editorContainer: HTMLDivElement;
  let editorView: EditorView;
  let currentNoteId: string | null = null;
  let currentTags: string[] = [];
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let errorMessage: string | null = null;
  let errorTimer: ReturnType<typeof setTimeout> | null = null;

  // --- frontmatter background decoration plugin ---
  const frontmatterPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    { decorations: (v) => v.decorations }
  );

  function buildDecorations(view: EditorView): DecorationSet {
    const doc = view.state.doc.toString();
    if (!doc.startsWith('---\n')) return Decoration.none;
    const endIdx = doc.indexOf('\n---\n', 4);
    if (endIdx === -1) return Decoration.none;
    const fmEnd = endIdx + 5;
    const marks: ReturnType<typeof Decoration.mark>[] = [];
    let line = view.state.doc.lineAt(0);
    while (line.from < fmEnd && line.number <= view.state.doc.lines) {
      marks.push(
        Decoration.line({ attributes: { style: 'background: var(--frontmatter-bg, #f0f4f8);' } }).range(line.from)
      );
      if (line.to >= fmEnd) break;
      if (line.number >= view.state.doc.lines) break;
      line = view.state.doc.line(line.number + 1);
    }
    return Decoration.set(marks, true);
  }

  // --- extract body without frontmatter ---
  function extractBody(doc: string): string {
    const match = doc.match(/^---\n[\s\S]*?\n---\n?/);
    return match ? doc.slice(match[0].length) : doc;
  }

  function getEditorContent(): string {
    if (!editorView) return '';
    return extractBody(editorView.state.doc.toString());
  }

  // --- debounced auto-save ---
  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      if (!currentNoteId || !editorView) return;
      const body = extractBody(editorView.state.doc.toString());
      try {
        await saveNote(currentNoteId, { tags: currentTags }, body);
      } catch (err) {
        console.error('save_note failed:', err);
        // retry up to 3 times after 3s on repeated failure is handled externally
      }
    }, 500);
  }

  function onTagsChange(tags: string[]) {
    currentTags = tags;
    debouncedSave();
  }

  // --- load note into editor ---
  async function loadNote(id: string) {
    try {
      const note: Note = await readNote(id);
      currentNoteId = note.metadata.id;
      currentTags = note.metadata.tags;
      if (editorView) {
        const fullContent = buildFileContent(note.metadata.tags, note.body);
        editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: fullContent },
        });
      }
    } catch (err) {
      console.error('read_note failed:', err);
      showError('ノートの読み込みに失敗しました');
    }
  }

  function buildFileContent(tags: string[], body: string): string {
    if (tags.length === 0) return `---\ntags: []\n---\n${body}`;
    return `---\ntags: [${tags.join(', ')}]\n---\n${body}`;
  }

  // --- new note creation ---
  async function handleCreateNote() {
    try {
      const metadata: NoteMetadata = await createNote();
      currentNoteId = metadata.id;
      currentTags = [];
      if (editorView) {
        editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: '---\ntags: []\n---\n' },
        });
        editorView.focus();
      }
      await refreshNoteList();
    } catch (err) {
      console.error('create_note failed:', err);
      showError('新規ノートの作成に失敗しました');
    }
  }

  async function refreshNoteList() {
    try {
      const notes = await listNotes();
      notesStore.set(notes);
    } catch (err) {
      console.error('list_notes failed:', err);
    }
  }

  // --- global Cmd+N / Ctrl+N ---
  function handleGlobalKeydown(e: KeyboardEvent) {
    const isMac = navigator.platform.includes('Mac');
    const modifier = isMac ? e.metaKey : e.ctrlKey;
    if (modifier && e.key === 'n') {
      e.preventDefault();
      handleCreateNote();
    }
  }

  // --- error display ---
  function showError(msg: string) {
    errorMessage = msg;
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      errorMessage = null;
    }, 3000);
  }

  // --- react to ?note={id} query param ---
  let prevNoteId: string | null = null;
  $: {
    const params = new URLSearchParams($querystring || '');
    const noteId = params.get('note');
    if (noteId && noteId !== prevNoteId) {
      prevNoteId = noteId;
      if (editorView) {
        loadNote(noteId);
      }
      // store for deferred load after mount
      currentNoteId = noteId;
    }
  }

  onMount(async () => {
    const state = EditorState.create({
      doc: '---\ntags: []\n---\n',
      extensions: [
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        lineWrapping,
        frontmatterPlugin,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) debouncedSave();
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': { fontFamily: 'monospace', padding: '16px' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });

    editorView = new EditorView({ state, parent: editorContainer });

    window.addEventListener('keydown', handleGlobalKeydown);

    // load note from query param if present on initial mount
    const params = new URLSearchParams($querystring || '');
    const noteId = params.get('note');
    if (noteId) {
      prevNoteId = noteId;
      await loadNote(noteId);
    } else {
      // initialize note list without loading a specific note
      await refreshNoteList();
    }
  });

  onDestroy(() => {
    editorView?.destroy();
    window.removeEventListener('keydown', handleGlobalKeydown);
    if (saveTimer) clearTimeout(saveTimer);
    if (errorTimer) clearTimeout(errorTimer);
  });
</script>

<div class="editor-layout">
  {#if errorMessage}
    <div class="error-banner" role="alert">{errorMessage}</div>
  {/if}

  <aside class="note-list-panel">
    <NoteList
      currentNoteId={currentNoteId}
      on:select={(e) => loadNote(e.detail.id)}
    />
  </aside>

  <section class="editor-panel">
    <FrontmatterBar
      tags={currentTags}
      on:change={(e) => onTagsChange(e.detail.tags)}
    />
    <div class="codemirror-host" bind:this={editorContainer}></div>
    <CopyButton {getEditorContent} />
  </section>
</div>

<style>
  .editor-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
    position: relative;
  }

  .error-banner {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: #fc8181;
    color: #fff;
    padding: 8px 16px;
    font-size: 14px;
    z-index: 100;
    text-align: center;
  }

  .note-list-panel {
    width: 240px;
    flex-shrink: 0;
    border-right: 1px solid var(--border-color, #e2e8f0);
    overflow-y: auto;
    background: var(--sidebar-bg, #f7fafc);
  }

  .editor-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .codemirror-host {
    flex: 1;
    overflow: hidden;
  }
</style>
