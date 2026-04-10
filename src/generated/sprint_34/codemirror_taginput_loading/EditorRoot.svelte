<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import type { EditorView } from '@codemirror/view';
  import CodeMirrorWrapper from '$lib/components/editor/CodeMirrorWrapper.svelte';
  import CopyButton from '$lib/components/editor/CopyButton.svelte';
  import TagInput from '$lib/components/editor/TagInput.svelte';
  import { readNote } from '$lib/api/notes';
  import { registerGlobalKeybindings } from '$lib/components/editor/keybindings';

  type EditorState =
    | 'Loading'
    | 'Editing'
    | 'Saving'
    | 'Error'
    | 'Copied'
    | 'Creating'
    | 'SaveError';

  export let filename: string;

  let state: EditorState = 'Loading';
  let editorView: EditorView | null = null;
  let tags: string[] = [];
  let initialBody = '';
  let errorMessage = '';
  let unregisterKeybindings: (() => void) | null = null;

  onMount(async () => {
    unregisterKeybindings = registerGlobalKeybindings();
    try {
      const data = await readNote(filename);
      tags = data.frontmatter.tags;
      initialBody = data.body;
      state = 'Editing';
    } catch (e) {
      state = 'Error';
      errorMessage = e instanceof Error ? e.message : String(e);
    }
  });

  onDestroy(() => {
    unregisterKeybindings?.();
  });

  function handleEditorReady(view: EditorView) {
    editorView = view;
    view.focus();
  }

  function handleTagsChange(newTags: string[]) {
    tags = newTags;
  }

  function goBack() {
    goto('/');
  }
</script>

<!-- タイトル入力欄（<input>, <textarea>）は設置禁止 -->
<div class="editor-root">
  <header class="editor-header">
    <button class="back-button" on:click={goBack} aria-label="グリッドビューに戻る">
      ← 戻る
    </button>
    <div class="header-right">
      {#if state === 'Saving'}
        <span class="save-status saving" aria-live="polite">保存中...</span>
      {:else if state === 'SaveError'}
        <span class="save-status save-error" role="alert">保存エラー</span>
      {:else if state === 'Editing'}
        <span class="save-status saved">保存済み</span>
      {/if}
      {#if editorView}
        <CopyButton
          {editorView}
          on:copied={() => { state = 'Copied'; }}
          on:copyEnd={() => { state = 'Editing'; }}
        />
      {/if}
    </div>
  </header>

  <main class="editor-main">
    {#if state === 'Loading'}
      <div class="loading-overlay" aria-live="polite" aria-label="読み込み中">
        <span>読み込み中...</span>
      </div>
    {:else if state === 'Creating'}
      <div class="loading-overlay" aria-live="polite" aria-label="作成中">
        <span>作成中...</span>
      </div>
    {:else if state === 'Error'}
      <div class="error-state" role="alert">
        <p>ノートを読み込めませんでした。</p>
        {#if errorMessage}
          <p class="error-detail">{errorMessage}</p>
        {/if}
        <button on:click={goBack}>グリッドビューに戻る</button>
      </div>
    {:else}
      <CodeMirrorWrapper
        {filename}
        {tags}
        {initialBody}
        on:ready={(e) => handleEditorReady(e.detail)}
        on:saving={() => { state = 'Saving'; }}
        on:saved={() => { state = 'Editing'; }}
        on:saveError={() => { state = 'SaveError'; }}
      />
    {/if}
  </main>

  <footer class="editor-footer">
    {#if state !== 'Loading' && state !== 'Creating' && state !== 'Error'}
      <TagInput
        {tags}
        {filename}
        on:change={(e) => handleTagsChange(e.detail)}
      />
    {/if}
  </footer>
</div>

<style>
  .editor-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background-color: var(--bg-primary, #ffffff);
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    background-color: var(--header-bg, #ffffff);
    flex-shrink: 0;
    min-height: 48px;
    z-index: 10;
  }

  .back-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-secondary, #666666);
    padding: 6px 12px;
    border-radius: 4px;
    line-height: 1;
  }

  .back-button:hover {
    background-color: var(--hover-bg, #f5f5f5);
    color: var(--text-primary, #333333);
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .save-status {
    font-size: 12px;
    color: var(--text-secondary, #aaaaaa);
  }

  .save-status.saving {
    color: var(--info-color, #2196f3);
  }

  .save-status.save-error {
    color: var(--error-color, #f44336);
    font-weight: 500;
  }

  .editor-main {
    flex: 1;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .loading-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    font-size: 14px;
    color: var(--text-secondary, #888888);
  }

  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 12px;
    padding: 24px;
    text-align: center;
    color: var(--text-primary, #333333);
  }

  .error-detail {
    font-size: 12px;
    color: var(--error-color, #f44336);
    font-family: monospace;
    background-color: var(--error-bg, #fef2f2);
    padding: 8px 12px;
    border-radius: 4px;
    max-width: 480px;
    word-break: break-all;
  }

  .error-state button {
    padding: 8px 20px;
    background-color: var(--primary-color, #1976d2);
    color: #ffffff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .error-state button:hover {
    background-color: var(--primary-hover, #1565c0);
  }

  .editor-footer {
    flex-shrink: 0;
    border-top: 1px solid var(--border-color, #e0e0e0);
    background-color: var(--footer-bg, #f9f9f9);
  }
</style>
