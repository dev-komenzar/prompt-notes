<!-- @traceability: detail:editor_clipboard §2.1–§4.6, design:system-design §2.6 (RB-1, RB-2, RBC-2) -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { EditorView, keymap, lineWrapping, ViewPlugin, Decoration } from '@codemirror/view';
  import type { DecorationSet, ViewUpdate } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
  import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';

  import NoteList from './NoteList.svelte';
  import FrontmatterBar from './FrontmatterBar.svelte';
  import CopyButton from './CopyButton.svelte';
  import { notesStore, selectedNoteId } from '../../stores/notes';
  import {
    createNote,
    saveNote,
    readNote,
    deleteNote,
    listNotes,
  } from '../../lib/ipc';
  import type { NoteMetadata } from '../../lib/types';

  let editorContainer: HTMLDivElement;
  let editorView: EditorView;
  let currentNoteId: string | null = null;
  let currentTags: string[] = [];
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let errorMessage: string | null = null;
  let saveRetries = 0;

  // frontmatter background decoration plugin
  const frontmatterPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }
      buildDecorations(view: EditorView): DecorationSet {
        const doc = view.state.doc.toString();
        const decorations: ReturnType<typeof Decoration.line>[] = [];
        if (!doc.startsWith('---\n')) return Decoration.set([]);
        const endIdx = doc.indexOf('\n---\n', 4);
        if (endIdx === -1) return Decoration.set([]);
        const fmEnd = endIdx + 5;
        let pos = 0;
        let lineNum = 1;
        while (pos < fmEnd && lineNum <= view.state.doc.lines) {
          const line = view.state.doc.line(lineNum);
          decorations.push(
            Decoration.line({ attributes: { class: 'cm-frontmatter-line' } }).range(line.from)
          );
          pos = line.to + 1;
          lineNum++;
          if (line.to >= fmEnd) break;
        }
        return Decoration.set(decorations, true);
      }
    },
    { decorations: (v) => v.decorations }
  );

  function extractBody(doc: string): string {
    const match = doc.match(/^---\n[\s\S]*?\n---\n?/);
    if (match) return doc.slice(match[0].length);
    return doc;
  }

  function getEditorContent(): string {
    if (!editorView) return '';
    return extractBody(editorView.state.doc.toString());
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      if (!currentNoteId) return;
      const body = getEditorContent();
      try {
        await saveNote(currentNoteId, { tags: currentTags }, body);
        saveRetries = 0;
        await refreshNoteList();
      } catch (err) {
        saveRetries++;
        if (saveRetries >= 3) {
          errorMessage = '保存に失敗しました。ディスクを確認してください。';
          setTimeout(() => { errorMessage = null; }, 3000);
          saveRetries = 0;
        } else {
          setTimeout(debouncedSave, 3000);
        }
      }
    }, 500);
  }

  function handleTagChange(event: CustomEvent<string[]>) {
    currentTags = event.detail;
    debouncedSave();
  }

  async function refreshNoteList() {
    try {
      const notes = await listNotes();
      notesStore.set(notes.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    } catch {
      // silently ignore list refresh errors
    }
  }

  async function handleSelectNote(event: CustomEvent<string>) {
    const id = event.detail;
    try {
      const note = await readNote(id);
      currentNoteId = note.id;
      currentTags = note.frontmatter.tags;
      selectedNoteId.set(id);
      const fullContent = `---\ntags: [${note.frontmatter.tags.join(', ')}]\n---\n${note.body}`;
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: fullContent,
        },
      });
      editorView.focus();
    } catch {
      errorMessage = 'ノートの読み込みに失敗しました。';
      setTimeout(() => { errorMessage = null; }, 3000);
    }
  }

  async function handleDeleteNote(event: CustomEvent<string>) {
    const id = event.detail;
    try {
      await deleteNote(id);
      if (currentNoteId === id) {
        currentNoteId = null;
        currentTags = [];
        selectedNoteId.set(null);
        editorView.dispatch({
          changes: { from: 0, to: editorView.state.doc.length, insert: '' },
        });
      }
      await refreshNoteList();
    } catch {
      errorMessage = '削除に失敗しました。';
      setTimeout(() => { errorMessage = null; }, 3000);
    }
  }

  async function handleCreateNote() {
    try {
      const metadata = await createNote();
      currentNoteId = metadata.id;
      currentTags = [];
      selectedNoteId.set(metadata.id);
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: '---\ntags: []\n---\n' },
      });
      editorView.focus();
      await refreshNoteList();
    } catch {
      errorMessage = '新規ノートの作成に失敗しました。';
      setTimeout(() => { errorMessage = null; }, 3000);
    }
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    const isMac = navigator.platform.includes('Mac');
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
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            debouncedSave();
          }
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': { fontFamily: "'JetBrains Mono', 'Fira Code', monospace", padding: '16px' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-frontmatter-line': { backgroundColor: 'var(--frontmatter-bg, #f0f4f8)' },
        }),
      ],
    });

    editorView = new EditorView({ state, parent: editorContainer });
    window.addEventListener('keydown', handleGlobalKeydown);

    await refreshNoteList();
    // auto-select most recent note if available
    const notes = await listNotes().catch(() => [] as NoteMetadata[]);
    if (notes.length > 0) {
      const sorted = notes.sort((a, b) => b.created_at.localeCompare(a.created_at));
      await handleSelectNote(new CustomEvent('select', { detail: sorted[0].id }));
    }
  });

  onDestroy(() => {
    if (saveTimer) clearTimeout(saveTimer);
    window.removeEventListener('keydown', handleGlobalKeydown);
    editorView?.destroy();
  });
</script>

<div class="editor-layout">
  <NoteList
    notes={$notesStore}
    selectedId={$selectedNoteId}
    on:select={handleSelectNote}
    on:delete={handleDeleteNote}
  />
  <div class="editor-panel">
    {#if errorMessage}
      <div class="error-banner">{errorMessage}</div>
    {/if}
    <FrontmatterBar tags={currentTags} on:change={handleTagChange} />
    <div class="cm-container" bind:this={editorContainer}></div>
  </div>
  <CopyButton {getContent: getEditorContent} />
</div>

<style>
  .editor-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
    position: relative;
  }
  .editor-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .cm-container {
    flex: 1;
    overflow: hidden;
  }
  .error-banner {
    background: #fee2e2;
    color: #dc2626;
    padding: 8px 16px;
    font-size: 13px;
    border-bottom: 1px solid #fca5a5;
  }
</style>
