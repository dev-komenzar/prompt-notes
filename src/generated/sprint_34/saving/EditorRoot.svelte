<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { EditorView, keymap } from '@codemirror/view';
  import { EditorState as CMEditorState } from '@codemirror/state';
  import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
  import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

  import { readNote, createNote } from '$lib/api/notes';
  import type { EditorState } from '../editing/stateTypes';
  import { isInteractive, BLOCKING_STATES } from '../editing/stateTypes';
  import { extractBody, extractTags } from '../editing/contentUtils';
  import { createAutoSaveExtension } from './autosave';

  export let filename: string;

  let editorContainer: HTMLDivElement;
  let editorView: EditorView | null = null;
  let state: EditorState = 'Loading';
  let errorMessage = '';
  let copied = false;
  let copyTimer: ReturnType<typeof setTimeout> | null = null;
  let tags: string[] = [];

  const isMac =
    typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  function handleSaving() {
    state = 'Saving';
  }

  function handleSaved() {
    state = 'Editing';
  }

  function handleSaveError(err: unknown) {
    state = 'SaveError';
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  async function loadNote() {
    state = 'Loading';
    try {
      const data = await readNote(filename);
      tags = data.frontmatter.tags ?? [];

      const frontmatterYaml =
        tags.length > 0
          ? `---\ntags: [${tags.join(', ')}]\n---\n`
          : `---\ntags: []\n---\n`;
      const initialDoc = frontmatterYaml + (data.body ?? '');

      if (editorView) {
        editorView.destroy();
      }

      const extensions = [
        markdown({ base: markdownLanguage }),
        syntaxHighlighting(defaultHighlightStyle),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        createAutoSaveExtension(filename, {
          onSaving: handleSaving,
          onSaved: handleSaved,
          onError: handleSaveError,
        }),
      ];

      const cmState = CMEditorState.create({ doc: initialDoc, extensions });
      editorView = new EditorView({ state: cmState, parent: editorContainer });
      state = 'Editing';
      editorView.focus();
    } catch (err) {
      state = 'Error';
      errorMessage = err instanceof Error ? err.message : String(err);
    }
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
      }, 2000);
    } catch {
      // clipboard failure is non-fatal
    }
  }

  async function handleNewNote() {
    state = 'Creating';
    try {
      const { filename: newFilename } = await createNote();
      await goto(`/edit/${newFilename}`);
    } catch (err) {
      state = 'Error';
      errorMessage = err instanceof Error ? err.message : String(err);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      handleNewNote();
    }
  }

  onMount(async () => {
    document.addEventListener('keydown', handleKeyDown);
    await loadNote();
  });

  onDestroy(() => {
    document.removeEventListener('keydown', handleKeyDown);
    if (copyTimer) clearTimeout(copyTimer);
    if (editorView) editorView.destroy();
  });

  $: displayTags = editorView
    ? extractTags(editorView.state.doc.toString())
    : tags;

  $: statusLabel = (() => {
    switch (state) {
      case 'Loading': return '読み込み中...';
      case 'Saving': return '保存中...';
      case 'Saved': return '保存済み';
      case 'SaveError': return '保存エラー';
      case 'Creating': return '作成中...';
      case 'Copied': return '✓ コピー済み';
      default: return '';
    }
  })();
</script>

<div class="editor-root">
  <!-- Header bar: no title input/textarea per NNC-E2 -->
  <header class="editor-header">
    <button class="back-btn" on:click={() => goto('/')} aria-label="グリッドビューに戻る">
      ← 戻る
    </button>

    <div class="header-right">
      {#if statusLabel}
        <span class="status-label" class:error={state === 'SaveError'}>{statusLabel}</span>
      {/if}
      <button
        class="copy-btn"
        class:copied={state === 'Copied'}
        on:click={handleCopy}
        disabled={BLOCKING_STATES.includes(state) && state !== 'Saving'}
        aria-label="本文をコピー"
      >
        {state === 'Copied' ? '✓ コピー済み' : 'コピー'}
      </button>
    </div>
  </header>

  <!-- Editor area -->
  <main class="editor-body">
    {#if state === 'Loading' || state === 'Creating'}
      <div class="overlay-message">{statusLabel}</div>
    {:else if state === 'Error'}
      <div class="error-panel">
        <p>エラー: {errorMessage}</p>
        <button on:click={() => goto('/')}>グリッドビューに戻る</button>
      </div>
    {/if}

    <!-- CodeMirror mount point — always present so editorView can be attached -->
    <div
      class="cm-container"
      bind:this={editorContainer}
      aria-hidden={!isInteractive(state)}
    ></div>
  </main>

  <!-- TagInput area at the bottom -->
  <footer class="editor-footer">
    <div class="tag-list" aria-label="タグ">
      {#each displayTags as tag (tag)}
        <span class="tag-badge">{tag}</span>
      {/each}
      <span class="tag-hint">タグは frontmatter 内で編集</span>
    </div>

    {#if state === 'SaveError'}
      <div class="save-error-banner" role="alert">
        自動保存に失敗しました: {errorMessage}
        <button on:click={() => { state = 'Editing'; }}>閉じる</button>
      </div>
    {/if}
  </footer>
</div>

<style>
  .editor-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    font-family: system-ui, sans-serif;
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid #e2e8f0;
    background: #fff;
    flex-shrink: 0;
  }

  .back-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #4a5568;
    padding: 4px 8px;
  }

  .back-btn:hover {
    color: #2d3748;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-label {
    font-size: 12px;
    color: #718096;
  }

  .status-label.error {
    color: #e53e3e;
  }

  .copy-btn {
    padding: 6px 14px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.15s;
  }

  .copy-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .copy-btn.copied {
    background: #16a34a;
  }

  .copy-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .editor-body {
    flex: 1;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .overlay-message {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.8);
    font-size: 14px;
    color: #718096;
    z-index: 10;
  }

  .error-panel {
    padding: 24px;
    color: #e53e3e;
  }

  .error-panel button {
    margin-top: 12px;
    padding: 6px 12px;
    background: #edf2f7;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .cm-container {
    flex: 1;
    overflow: auto;
    height: 100%;
  }

  :global(.cm-editor) {
    height: 100%;
    font-size: 14px;
  }

  :global(.cm-frontmatter-bg) {
    background-color: rgba(59, 130, 246, 0.08);
  }

  .editor-footer {
    flex-shrink: 0;
    border-top: 1px solid #e2e8f0;
    padding: 8px 16px;
    background: #f7fafc;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .tag-badge {
    display: inline-block;
    padding: 2px 8px;
    background: #e2e8f0;
    border-radius: 12px;
    font-size: 12px;
    color: #4a5568;
  }

  .tag-hint {
    font-size: 11px;
    color: #a0aec0;
  }

  .save-error-banner {
    margin-top: 6px;
    padding: 6px 12px;
    background: #fff5f5;
    border: 1px solid #fed7d7;
    border-radius: 4px;
    font-size: 12px;
    color: #c53030;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .save-error-banner button {
    background: none;
    border: none;
    cursor: pointer;
    color: #c53030;
    font-size: 11px;
    text-decoration: underline;
  }
</style>
