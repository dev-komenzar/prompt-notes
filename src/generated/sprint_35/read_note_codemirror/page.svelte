<!--
  @codd:sprint=35 task=35-1 module=editor
  Target path: src/routes/edit/[filename]/+page.svelte
  Implements: read_note load → CodeMirror set → autosave enabled
  NNC-E2: no title input. NNC-E3: copy button required. NNC-E1: frontmatter bg.
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import type { EditorView } from '@codemirror/view';
  import { loadNote, buildDocContent, parseFrontmatterAndBody } from './editor-loader';
  import { createEditorView, placeCursorAfterFrontmatter } from './codemirror-setup';
  import { registerGlobalKeybindings } from './keybindings';

  type PageState = 'loading' | 'editing' | 'error';

  let editorContainer: HTMLElement;
  let editorView: EditorView | null = null;
  let unregisterKeys: (() => void) | null = null;

  let state: PageState = 'loading';
  let errorMessage = '';
  let copied = false;
  let copyTimer: ReturnType<typeof setTimeout> | null = null;

  // Track the last filename we initialized to avoid redundant re-inits.
  let lastFilename = '';

  $: filename = $page.params.filename;
  $: if (editorContainer && filename && filename !== lastFilename) {
    initEditor(filename);
  }

  onMount(() => {
    unregisterKeys = registerGlobalKeybindings();
  });

  onDestroy(() => {
    unregisterKeys?.();
    editorView?.destroy();
    if (copyTimer) clearTimeout(copyTimer);
  });

  async function initEditor(fn: string) {
    lastFilename = fn;
    state = 'loading';
    errorMessage = '';

    try {
      const noteData = await loadNote(fn);
      const docContent = buildDocContent(noteData.frontmatter, noteData.body);

      // Destroy previous instance before creating a new one.
      if (editorView) {
        editorView.destroy();
        editorView = null;
      }

      editorView = createEditorView({
        parent: editorContainer,
        content: docContent,
        filename: fn,
      });

      placeCursorAfterFrontmatter(editorView);
      state = 'editing';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      state = 'error';
    }
  }

  async function handleCopy() {
    if (!editorView) return;
    const { body } = parseFrontmatterAndBody(editorView.state.doc.toString());
    try {
      await navigator.clipboard.writeText(body);
      copied = true;
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      console.error('[copy] clipboard write failed:', err);
    }
  }
</script>

<div class="editor-page">
  <header class="editor-header">
    <button class="back-btn" on:click={() => history.back()} aria-label="戻る">← 戻る</button>
    <!-- NNC-E3: 1-click copy button is a release-blocking core UX -->
    <button
      class="copy-btn"
      class:copied
      on:click={handleCopy}
      disabled={state !== 'editing'}
      aria-label="本文をコピー"
    >
      {copied ? '✓ コピー済み' : 'コピー'}
    </button>
  </header>

  <div class="content-area">
    <!-- Always in DOM so CodeMirror can mount to it; visibility controlled via CSS -->
    <div
      bind:this={editorContainer}
      class="editor-container"
      aria-hidden={state !== 'editing'}
      class:invisible={state !== 'editing'}
    ></div>

    {#if state === 'loading'}
      <div class="overlay loading-overlay" aria-live="polite">読み込み中...</div>
    {:else if state === 'error'}
      <div class="overlay error-overlay" role="alert">
        <p>ノートの読み込みに失敗しました。</p>
        <code class="error-detail">{errorMessage}</code>
        <button on:click={() => history.back()}>グリッドビューへ戻る</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .editor-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background: #fff;
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
  }

  .back-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #555;
    padding: 4px 8px;
    border-radius: 4px;
  }
  .back-btn:hover { color: #000; background: #f5f5f5; }

  .copy-btn {
    padding: 6px 14px;
    background: #4caf50;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.15s;
    min-width: 96px;
  }
  .copy-btn:hover:not(:disabled) { background: #388e3c; }
  .copy-btn.copied { background: #1565c0; }
  .copy-btn:disabled { background: #bdbdbd; cursor: default; }

  .content-area {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .editor-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .editor-container.invisible { visibility: hidden; pointer-events: none; }

  /* CodeMirror fills the container */
  .editor-container :global(.cm-editor) {
    height: 100%;
  }
  .editor-container :global(.cm-scroller) {
    overflow: auto;
    flex: 1;
  }

  /* NNC-E1: frontmatter region background differentiation */
  :global(.cm-frontmatter-bg) {
    background-color: rgba(59, 130, 246, 0.08);
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: #fff;
  }

  .loading-overlay { color: #888; font-size: 14px; }

  .error-overlay { color: #c62828; }
  .error-detail {
    font-size: 12px;
    color: #757575;
    font-family: monospace;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 4px;
    max-width: 480px;
    word-break: break-all;
  }
  .error-overlay button {
    margin-top: 8px;
    padding: 6px 14px;
    border: 1px solid #bdbdbd;
    border-radius: 4px;
    cursor: pointer;
    background: #fff;
  }
  .error-overlay button:hover { background: #f5f5f5; }
</style>
