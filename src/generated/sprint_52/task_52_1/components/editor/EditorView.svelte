<!-- @generated-from: docs/detailed_design/editor_clipboard_design.md -->
<!-- @generated-by: codd implement --sprint 52 -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    EditorView as CM6EditorView,
    keymap,
    lineWrapping,
    ViewPlugin,
    Decoration,
    type DecorationSet,
    type ViewUpdate,
  } from '@codemirror/view';
  import { EditorState, RangeSetBuilder } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
  import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
  import { createNote, saveNote, readNote, deleteNote } from '../../lib/ipc';
  import { notesStore, selectedNoteId } from '../../stores/notes';
  import { get } from 'svelte/store';
  import type { Note } from '../../lib/types';
  import NoteList from './NoteList.svelte';
  import FrontmatterBar from './FrontmatterBar.svelte';
  import CopyButton from './CopyButton.svelte';

  let editorContainer: HTMLDivElement;
  let cmView: CM6EditorView;
  let currentNoteId: string | null = null;
  let currentTags: string[] = [];
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let saveRetries = 0;
  let errorMessage: string | null = null;
  let errorTimer: ReturnType<typeof setTimeout> | null = null;
  let noteListRef: NoteList;

  const frontmatterPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: CM6EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: CM6EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const doc = view.state.doc;
        const text = doc.toString();
        if (!text.startsWith('---\n')) return builder.finish();
        const endIdx = text.indexOf('\n---\n', 4);
        if (endIdx === -1) return builder.finish();
        const fmEnd = endIdx + 5;
        for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
          const line = doc.line(lineNum);
          if (line.from >= fmEnd) break;
          builder.add(line.from, line.from, Decoration.line({ class: 'cm-frontmatter-line' }));
        }
        return builder.finish();
      }
    },
    { decorations: (v) => v.decorations },
  );

  function extractBody(docText: string): string {
    const match = docText.match(/^---\n[\s\S]*?\n---\n?/);
    if (match) return docText.slice(match[0].length);
    return docText;
  }

  function buildDocContent(tags: string[], body: string): string {
    return `---\ntags: [${tags.join(', ')}]\n---\n${body}`;
  }

  function getEditorContent(): string {
    if (!cmView) return '';
    return extractBody(cmView.state.doc.toString());
  }

  function showError(msg: string) {
    errorMessage = msg;
    if (errorTimer) clearTimeout(errorTimer);
    errorTimer = setTimeout(() => {
      errorMessage = null;
    }, 3000);
  }

  async function persistSave() {
    if (!currentNoteId) return;
    const body = extractBody(cmView.state.doc.toString());
    try {
      await saveNote(currentNoteId, { tags: currentTags }, body);
      saveRetries = 0;
    } catch {
      saveRetries++;
      if (saveRetries < 3) {
        setTimeout(persistSave, 3000);
      } else {
        saveRetries = 0;
        showError('自動保存に失敗しました。ディスクの空き容量を確認してください。');
      }
    }
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(persistSave, 500);
  }

  function setEditorDoc(tags: string[], body: string) {
    if (!cmView) return;
    const content = buildDocContent(tags, body);
    cmView.dispatch({
      changes: { from: 0, to: cmView.state.doc.length, insert: content },
    });
  }

  async function handleCreateNote() {
    try {
      const metadata = await createNote();
      currentNoteId = metadata.id;
      currentTags = [];
      setEditorDoc([], '');
      cmView.focus();
      await noteListRef?.refresh();
    } catch {
      showError('新規ノートの作成に失敗しました。');
    }
  }

  async function handleNoteSelect(noteId: string) {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
      await persistSave();
    }
    try {
      const note: Note = await readNote(noteId);
      currentNoteId = note.id;
      currentTags = [...note.frontmatter.tags];
      setEditorDoc(note.frontmatter.tags, note.body);
      cmView.focus();
    } catch {
      showError('ノートの読み込みに失敗しました。');
    }
  }

  async function handleNoteDelete(noteId: string) {
    try {
      await deleteNote(noteId);
      if (currentNoteId === noteId) {
        currentNoteId = null;
        currentTags = [];
        cmView.dispatch({
          changes: { from: 0, to: cmView.state.doc.length, insert: '' },
        });
      }
      await noteListRef?.refresh();
    } catch {
      showError('ノートの削除に失敗しました。');
    }
  }

  function handleTagsChange(event: CustomEvent<string[]>) {
    currentTags = event.detail;
    scheduleSave();
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
    const state = EditorState.create({
      doc: '',
      extensions: [
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        lineWrapping,
        frontmatterPlugin,
        CM6EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            scheduleSave();
          }
        }),
        CM6EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': { fontFamily: 'monospace', padding: '16px' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-frontmatter-line': { backgroundColor: 'var(--frontmatter-bg, #f0f4f8)' },
        }),
      ],
    });

    cmView = new CM6EditorView({ state, parent: editorContainer });
    window.addEventListener('keydown', handleGlobalKeydown);

    // Check if a note was selected from GridView
    const pending = get(selectedNoteId);
    if (pending) {
      selectedNoteId.set(null);
      await handleNoteSelect(pending);
    } else {
      // Load most recent note or create new one
      const notes = get(notesStore);
      if (notes.length > 0) {
        await handleNoteSelect(notes[0].id);
      } else {
        await handleCreateNote();
      }
    }
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleGlobalKeydown);
    if (saveTimer) clearTimeout(saveTimer);
    if (errorTimer) clearTimeout(errorTimer);
    cmView?.destroy();
  });
</script>

<div class="editor-layout">
  <NoteList
    bind:this={noteListRef}
    selectedId={currentNoteId}
    on:select={(e) => handleNoteSelect(e.detail)}
    on:delete={(e) => handleNoteDelete(e.detail)}
  />

  <div class="editor-main">
    {#if errorMessage}
      <div class="error-banner" role="alert">{errorMessage}</div>
    {/if}

    <FrontmatterBar tags={currentTags} on:change={handleTagsChange} />

    <div class="cm-wrapper" bind:this={editorContainer}></div>

    <CopyButton getContent={getEditorContent} />
  </div>
</div>

<style>
  .editor-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .editor-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    position: relative;
  }

  .cm-wrapper {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .cm-wrapper :global(.cm-editor) {
    height: 100%;
  }

  .error-banner {
    background: #fed7d7;
    color: #c53030;
    padding: 8px 16px;
    font-size: 13px;
    border-bottom: 1px solid #feb2b2;
  }
</style>
