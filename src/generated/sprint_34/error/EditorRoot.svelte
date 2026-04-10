<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { EditorView } from '@codemirror/view';
  import { EditorState as CMState } from '@codemirror/state';
  import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
  import { keymap } from '@codemirror/view';
  import { readNote, createNote } from '$lib/api/notes';
  import type { EditorState } from '../editing/stateTypes';
  import { isInteractive, extractBody, extractTags, BLOCKING_STATES } from '../editing/contentUtils';
  import { buildFullContent } from '../editing/contentUtils';
  import { createAutoSaveExtension, parseFrontmatterAndBody } from '../saving/autosave';
  import type { AutoSaveCallbacks } from '../saving/autosave';

  export let filename: string;

  let editorContainer: HTMLElement;
  let editorView: EditorView | null = null;
  let state: EditorState = 'Loading';
  let errorMessage = '';
  let saveErrorMessage = '';
  let copied = false;
  let copyTimer: ReturnType<typeof setTimeout> | null = null;
  let tags: string[] = [];
  let tagInput = '';
  let cleanupKeybindings: (() => void) | null = null;

  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  async function initEditor(initialContent: string) {
    if (!editorContainer) return;

    const autoSaveCallbacks: AutoSaveCallbacks = {
      onSaveStart: () => {
        if (state === 'Editing') state = 'Saving';
      },
      onSaveSuccess: () => {
        if (state === 'Saving') state = 'Editing';
        saveErrorMessage = '';
      },
      onSaveError: (err: string) => {
        state = 'SaveError';
        saveErrorMessage = err;
      },
    };

    const extensions = [
      markdown({ base: markdownLanguage }),
      syntaxHighlighting(defaultHighlightStyle),
      createAutoSaveExtension(filename, autoSaveCallbacks),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      history(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && (state === 'Editing' || state === 'Saving' || state === 'SaveError')) {
          if (state === 'SaveError') state = 'Editing';
        }
      }),
    ];

    const cmState = CMState.create({ doc: initialContent, extensions });
    editorView = new EditorView({ state: cmState, parent: editorContainer });
    state = 'Editing';
    editorView.focus();

    const { body: _body, frontmatter } = parseFrontmatterAndBody(initialContent);
    tags = frontmatter.tags ?? [];
  }

  async function handleNewNote() {
    if (BLOCKING_STATES.includes(state as any)) return;
    state = 'Creating';
    try {
      const { filename: newFilename } = await createNote();
      await goto(`/edit/${newFilename}`);
    } catch (err) {
      state = 'Editing';
    }
  }

  function registerKeybindings() {
    const handler = async (e: KeyboardEvent) => {
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        await handleNewNote();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }

  async function handleCopy() {
    if (!editorView) return;
    const doc = editorView.state.doc.toString();
    const body = extractBody(doc);
    try {
      await navigator.clipboard.writeText(body);
      state = 'Copied';
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        if (state === 'Copied') state = 'Editing';
        copied = false;
      }, 2000);
      copied = true;
    } catch (_) {
      // clipboard write failed silently
    }
  }

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    tags = [...tags, trimmed];
    tagInput = '';
    syncTagsToEditor();
  }

  function removeTag(tag: string) {
    tags = tags.filter((t) => t !== tag);
    syncTagsToEditor();
  }

  function syncTagsToEditor() {
    if (!editorView) return;
    const doc = editorView.state.doc.toString();
    const { body } = parseFrontmatterAndBody(doc);
    const newContent = buildFullContent({ tags }, body);
    editorView.dispatch({
      changes: { from: 0, to: editorView.state.doc.length, insert: newContent },
    });
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  }

  function retrySave() {
    if (!editorView) return;
    state = 'Editing';
    const doc = editorView.state.doc.toString();
    editorView.dispatch({ changes: { from: 0, to: 0, insert: '' } });
    editorView.dispatch({ changes: { from: 0, to: 0, insert: '' } });
    // Trigger autosave by dispatching a no-op that marks docChanged
    editorView.dispatch({
      changes: { from: doc.length, to: doc.length, insert: '\u200B' },
    });
    editorView.dispatch({
      changes: { from: doc.length, to: doc.length + 1, insert: '' },
    });
  }

  onMount(async () => {
    cleanupKeybindings = registerKeybindings();
    try {
      const data = await readNote(filename);
      const content = buildFullContent(data.frontmatter, data.body);
      await initEditor(content);
    } catch (err) {
      state = 'Error';
      errorMessage =
        err instanceof Error ? err.message : 'ノートの読み込みに失敗しました。';
    }
  });

  onDestroy(() => {
    if (editorView) {
      editorView.destroy();
      editorView = null;
    }
    if (cleanupKeybindings) cleanupKeybindings();
    if (copyTimer) clearTimeout(copyTimer);
  });
</script>

<div class="editor-root">
  <!-- Header bar -->
  <header class="editor-header">
    <button class="back-btn" on:click={() => goto('/')} aria-label="グリッドビューへ戻る">
      ← 戻る
    </button>
    <div class="header-actions">
      {#if state === 'Saving'}
        <span class="save-status saving" aria-live="polite">保存中...</span>
      {:else if state === 'SaveError'}
        <span class="save-status save-error" aria-live="assertive">
          保存失敗
          <button class="retry-btn" on:click={retrySave}>再試行</button>
        </span>
      {:else if state === 'Editing' || state === 'Copied'}
        <span class="save-status saved" aria-live="polite">保存済み</span>
      {/if}
      {#if state !== 'Loading' && state !== 'Error'}
        <button
          class="copy-btn"
          class:copied
          on:click={handleCopy}
          disabled={state === 'Creating'}
          aria-label="本文をコピー"
        >
          {copied ? '✓ コピー済み' : 'コピー'}
        </button>
      {/if}
    </div>
  </header>

  <!-- Error state -->
  {#if state === 'Error'}
    <div class="error-screen" role="alert">
      <p class="error-title">ノートを読み込めませんでした</p>
      <p class="error-detail">{errorMessage}</p>
      <button class="back-btn-large" on:click={() => goto('/')}>
        グリッドビューへ戻る
      </button>
    </div>

  {:else if state === 'Loading'}
    <div class="loading-screen" aria-live="polite" aria-busy="true">
      <span>読み込み中...</span>
    </div>

  {:else if state === 'Creating'}
    <div class="loading-screen" aria-live="polite" aria-busy="true">
      <span>新規ノートを作成中...</span>
    </div>

  {:else}
    <!-- Editor area -->
    <div class="editor-area" bind:this={editorContainer}></div>

    <!-- Tag input -->
    <div class="tag-input-area" aria-label="タグ入力">
      {#each tags as tag}
        <span class="tag-badge">
          {tag}
          <button
            class="tag-remove"
            on:click={() => removeTag(tag)}
            aria-label="{tag} を削除"
          >×</button>
        </span>
      {/each}
      <input
        class="tag-input"
        type="text"
        placeholder="タグを追加..."
        bind:value={tagInput}
        on:keydown={handleTagKeydown}
        aria-label="新しいタグ"
      />
    </div>

    {#if state === 'SaveError'}
      <div class="save-error-banner" role="alert">
        保存に失敗しました: {saveErrorMessage}
        <button class="retry-btn-inline" on:click={retrySave}>再試行</button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .editor-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid #e0e0e0;
    background: #fff;
    flex-shrink: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .back-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #555;
    padding: 4px 8px;
  }

  .back-btn:hover {
    color: #000;
  }

  .copy-btn {
    padding: 6px 14px;
    background: #1976d2;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.15s;
  }

  .copy-btn:hover:not(:disabled) {
    background: #1565c0;
  }

  .copy-btn.copied {
    background: #388e3c;
  }

  .copy-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .save-status {
    font-size: 12px;
    color: #888;
  }

  .save-status.saving {
    color: #1976d2;
  }

  .save-status.save-error {
    color: #d32f2f;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .save-status.saved {
    color: #388e3c;
  }

  .retry-btn {
    font-size: 12px;
    padding: 2px 8px;
    background: none;
    border: 1px solid #d32f2f;
    border-radius: 3px;
    color: #d32f2f;
    cursor: pointer;
  }

  .retry-btn:hover {
    background: #ffebee;
  }

  .editor-area {
    flex: 1;
    overflow: auto;
    min-height: 0;
  }

  .editor-area :global(.cm-editor) {
    height: 100%;
  }

  .editor-area :global(.cm-scroller) {
    min-height: 100%;
  }

  .editor-area :global(.cm-frontmatter-bg) {
    background-color: rgba(59, 130, 246, 0.08);
  }

  .tag-input-area {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-top: 1px solid #e0e0e0;
    background: #fafafa;
    flex-shrink: 0;
  }

  .tag-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    background: #e3f2fd;
    border-radius: 12px;
    font-size: 12px;
    color: #1565c0;
  }

  .tag-remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 12px;
    color: #1565c0;
    padding: 0;
    line-height: 1;
  }

  .tag-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 13px;
    min-width: 120px;
  }

  .error-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 32px;
    gap: 12px;
  }

  .error-title {
    font-size: 18px;
    font-weight: 600;
    color: #d32f2f;
    margin: 0;
  }

  .error-detail {
    font-size: 14px;
    color: #555;
    margin: 0;
    text-align: center;
  }

  .back-btn-large {
    margin-top: 16px;
    padding: 10px 24px;
    background: #1976d2;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .back-btn-large:hover {
    background: #1565c0;
  }

  .loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: #888;
    font-size: 14px;
  }

  .save-error-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: #ffebee;
    color: #d32f2f;
    font-size: 13px;
    border-top: 1px solid #ffcdd2;
    flex-shrink: 0;
  }

  .retry-btn-inline {
    padding: 3px 10px;
    background: none;
    border: 1px solid #d32f2f;
    border-radius: 3px;
    color: #d32f2f;
    cursor: pointer;
    font-size: 12px;
  }

  .retry-btn-inline:hover {
    background: #ffcdd2;
  }
</style>
