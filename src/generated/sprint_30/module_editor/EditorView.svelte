<script lang="ts">
  // @sprint: 30
  // @task: 30-1
  // @module: editor
  // @implements: window.addEventListener('keydown') Cmd+N/Ctrl+N → createNote() → EditorView.focus()
  import { onMount, onDestroy } from 'svelte';
  import { EditorView as CMEditorView, keymap, lineWrapping, ViewPlugin, Decoration } from '@codemirror/view';
  import type { DecorationSet, ViewUpdate } from '@codemirror/view';
  import { EditorState } from '@codemirror/state';
  import { markdown } from '@codemirror/lang-markdown';
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
  import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
  import { createNote, saveNote, readNote, listNotes } from '$lib/ipc';
  import type { Note } from '$lib/types';
  import { notesStore } from '$stores/notes';
  import NoteList from './NoteList.svelte';
  import FrontmatterBar from './FrontmatterBar.svelte';
  import CopyButton from './CopyButton.svelte';

  let editorView: CMEditorView | null = null;
  let editorContainer: HTMLDivElement;
  let currentNoteId: string | null = null;
  let currentTags: string[] = [];
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let saveRetryCount = 0;
  let errorMessage: string | null = null;
  let errorTimeout: ReturnType<typeof setTimeout> | null = null;

  // frontmatter 背景色プラグイン (RBC-2: frontmatter領域は背景色で視覚的に区別)
  const frontmatterPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: CMEditorView) {
        this.decorations = this.buildDecorations(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }
      buildDecorations(view: CMEditorView): DecorationSet {
        const doc = view.state.doc;
        const text = doc.toString();
        if (!text.startsWith('---\n')) return Decoration.none;
        const afterOpen = text.indexOf('\n---', 4);
        if (afterOpen === -1) return Decoration.none;
        const fmEndPos = afterOpen + 4; // after closing '---'
        const endLine = doc.lineAt(Math.min(fmEndPos, doc.length)).number;
        const ranges: ReturnType<typeof Decoration.line>[] = [];
        for (let i = 1; i <= endLine; i++) {
          const line = doc.line(i);
          ranges.push(Decoration.line({ class: 'cm-frontmatter-line' }).range(line.from));
        }
        return Decoration.set(ranges, true);
      }
    },
    { decorations: (v: any) => v.decorations }
  );

  function extractBody(doc: string): string {
    const match = doc.match(/^---\n[\s\S]*?\n---\n?/);
    return match ? doc.slice(match[0].length) : doc;
  }

  function buildDocContent(tags: string[], body: string): string {
    const tagStr = tags.length > 0 ? tags.join(', ') : '';
    return `---\ntags: [${tagStr}]\n---\n${body}`;
  }

  export function getEditorContent(): string {
    if (!editorView) return '';
    return extractBody(editorView.state.doc.toString());
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await performSave();
    }, 500);
  }

  async function performSave(retry = 0) {
    if (!currentNoteId || !editorView) return;
    const body = extractBody(editorView.state.doc.toString());
    try {
      await saveNote(currentNoteId, { tags: currentTags }, body);
      saveRetryCount = 0;
    } catch (err) {
      console.error('Auto-save failed:', err);
      if (retry < 3) {
        setTimeout(() => performSave(retry + 1), 3000);
      } else {
        showError('保存に失敗しました。ディスクの空き容量を確認してください。');
        saveRetryCount = 0;
      }
    }
  }

  function onTagsChange(tags: string[]) {
    currentTags = tags;
    if (editorView) {
      const body = extractBody(editorView.state.doc.toString());
      const newDoc = buildDocContent(tags, body);
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: newDoc },
      });
    }
    debouncedSave();
  }

  // Cmd+N / Ctrl+N グローバルキーバインドハンドラ (RB-1, AC-EDIT-03)
  async function handleCreateNote() {
    try {
      const metadata = await createNote();
      currentNoteId = metadata.id;
      currentTags = [];
      if (editorView) {
        editorView.dispatch({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: buildDocContent([], ''),
          },
        });
        // createNote() 完了後に即座にフォーカス移動 (100ms以下目標)
        editorView.focus();
      }
      await refreshNoteList();
    } catch (err) {
      showError('新規ノートの作成に失敗しました');
      console.error('createNote failed:', err);
    }
  }

  async function handleSelectNote(noteId: string) {
    try {
      const note: Note = await readNote(noteId);
      currentNoteId = note.id;
      currentTags = note.frontmatter.tags;
      if (editorView) {
        editorView.dispatch({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: buildDocContent(note.frontmatter.tags, note.body),
          },
        });
        editorView.focus();
      }
    } catch (err) {
      showError('ノートの読み込みに失敗しました');
      console.error('readNote failed:', err);
    }
  }

  async function refreshNoteList() {
    try {
      const notes = await listNotes();
      notesStore.set(notes);
    } catch (err) {
      console.error('listNotes failed:', err);
    }
  }

  function showError(msg: string) {
    errorMessage = msg;
    if (errorTimeout) clearTimeout(errorTimeout);
    errorTimeout = setTimeout(() => {
      errorMessage = null;
    }, 3000);
  }

  // window.addEventListener('keydown') によるグローバルキーバインド登録 (RB-1, 設計 §3.5)
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
      doc: buildDocContent([], ''),
      extensions: [
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        lineWrapping,
        frontmatterPlugin,
        CMEditorView.updateListener.of((update) => {
          if (update.docChanged) {
            debouncedSave();
          }
        }),
        CMEditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': { fontFamily: 'monospace', padding: '16px' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-frontmatter-line': {
            backgroundColor: 'var(--frontmatter-bg, #f0f4f8)',
          },
        }),
      ],
    });

    editorView = new CMEditorView({ state, parent: editorContainer });

    // グローバルキーバインド登録 (onMount で登録, onDestroy で解除)
    window.addEventListener('keydown', handleGlobalKeydown);

    await refreshNoteList();
    // 起動時に新規ノートを作成してフォーカス
    await handleCreateNote();
  });

  onDestroy(() => {
    // グローバルキーバインド解除
    window.removeEventListener('keydown', handleGlobalKeydown);
    if (saveTimer) clearTimeout(saveTimer);
    if (errorTimeout) clearTimeout(errorTimeout);
    editorView?.destroy();
  });
</script>

{#if errorMessage}
  <div class="error-banner" role="alert">{errorMessage}</div>
{/if}

<div class="editor-layout">
  <aside class="note-list-panel">
    <NoteList onSelect={handleSelectNote} />
  </aside>

  <main class="editor-panel">
    <FrontmatterBar tags={currentTags} onChange={onTagsChange} />
    <div class="editor-container" bind:this={editorContainer}></div>
    <CopyButton getContent={getEditorContent} />
  </main>
</div>

<style>
  :global(:root) {
    --frontmatter-bg: #f0f4f8;
  }

  .error-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #e53e3e;
    color: #fff;
    padding: 8px 16px;
    z-index: 1000;
    text-align: center;
    font-size: 14px;
  }

  .editor-layout {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  .note-list-panel {
    width: 240px;
    flex-shrink: 0;
    border-right: 1px solid #e2e8f0;
    overflow-y: auto;
    background: #fafafa;
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
</style>
