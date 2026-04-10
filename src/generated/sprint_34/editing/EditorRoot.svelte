<script lang="ts">
  // @codd-trace sprint:34 task:34-2 module:editor
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import type { EditorView } from '@codemirror/view';
  import { readNote, saveNote, createNote } from '$lib/api/notes';

  // Re-export filename as required by task 34-1 contract
  export let filename: string;

  type EditorState =
    | 'Loading'
    | 'Editing'
    | 'Saving'
    | 'Error'
    | 'Copied'
    | 'Creating'
    | 'SaveError';

  let state: EditorState = 'Loading';
  let editorView: EditorView | null = null;
  let tags: string[] = [];
  let body = '';
  let errorMessage = '';

  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let copiedTimer: ReturnType<typeof setTimeout> | null = null;
  let unregisterKeybinding: (() => void) | null = null;

  const AUTOSAVE_DEBOUNCE_MS = 750;

  // ── Load note on mount ──────────────────────────────────────────────────────

  onMount(async () => {
    try {
      const data = await readNote(filename);
      tags = data.frontmatter.tags ?? [];
      body = data.body;
      state = 'Editing';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      state = 'Error';
      return;
    }

    // Focus editor after data is loaded and CodeMirror mounts
    // editorView is bound from CodeMirrorWrapper via bind:editorView
    // We defer one tick to ensure the view is mounted
    await tick();
    editorView?.focus();

    unregisterKeybinding = registerNewNoteKeybinding();
  });

  onDestroy(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    if (copiedTimer) clearTimeout(copiedTimer);
    unregisterKeybinding?.();
  });

  // ── Auto-save ───────────────────────────────────────────────────────────────

  function scheduleAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(async () => {
      await triggerSave();
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  async function triggerSave() {
    if (state === 'Error' || state === 'Loading' || state === 'Creating') return;
    state = 'Saving';
    try {
      await saveNote(filename, { tags }, body);
      state = 'Editing';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      state = 'SaveError';
    }
  }

  function handleDocChange(newBody: string) {
    body = newBody;
    scheduleAutoSave();
  }

  function handleTagsChange(newTags: string[]) {
    tags = newTags;
    scheduleAutoSave();
  }

  // ── Copy ────────────────────────────────────────────────────────────────────

  async function handleCopy() {
    const text = extractBody(editorView?.state.doc.toString() ?? body);
    await navigator.clipboard.writeText(text);
    state = 'Copied';
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      state = 'Editing';
    }, 2000);
  }

  function extractBody(doc: string): string {
    const match = doc.match(/^---\n[\s\S]*?\n---\n/);
    return match ? doc.slice(match[0].length) : doc;
  }

  // ── Cmd+N / Ctrl+N ──────────────────────────────────────────────────────────

  function registerNewNoteKeybinding(): () => void {
    const isMac = navigator.platform.toUpperCase().includes('MAC');

    const handler = async (e: KeyboardEvent) => {
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        if (state === 'Creating') return;
        state = 'Creating';
        try {
          const { filename: newFilename } = await createNote();
          await goto(`/edit/${encodeURIComponent(newFilename)}`);
        } catch (err) {
          errorMessage = err instanceof Error ? err.message : String(err);
          state = 'Error';
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async function tick(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  function handleBack() {
    goto('/');
  }
</script>

{#if state === 'Loading'}
  <!-- Loading overlay — CodeMirrorWrapper renders skeleton underneath -->
  <div class="editor-root" aria-busy="true">
    <header class="editor-header">
      <button class="back-btn" on:click={handleBack} aria-label="グリッドビューへ戻る">←</button>
      <span class="status-label">読み込み中…</span>
    </header>
    <div class="editor-body-placeholder" />
    <div class="tag-input-placeholder" />
  </div>

{:else if state === 'Error'}
  <div class="editor-root editor-root--error" role="alert">
    <header class="editor-header">
      <button class="back-btn" on:click={handleBack} aria-label="グリッドビューへ戻る">←</button>
    </header>
    <p class="error-message">ノートの読み込みに失敗しました: {errorMessage}</p>
  </div>

{:else}
  <!-- Editing / Saving / Copied / Creating / SaveError -->
  <div class="editor-root">
    <header class="editor-header">
      <button class="back-btn" on:click={handleBack} aria-label="グリッドビューへ戻る">←</button>

      <div class="header-status">
        {#if state === 'Saving'}
          <span class="status-label status-label--saving">保存中…</span>
        {:else if state === 'SaveError'}
          <span class="status-label status-label--error" role="alert">
            保存に失敗しました: {errorMessage}
          </span>
        {:else if state === 'Creating'}
          <span class="status-label status-label--creating">作成中…</span>
        {/if}
      </div>

      <!-- 1-click copy button — core UX, release blocker if absent (NNC-E3) -->
      <button
        class="copy-btn"
        class:copy-btn--copied={state === 'Copied'}
        on:click={handleCopy}
        disabled={state === 'Loading' || state === 'Creating'}
        aria-label="本文をクリップボードにコピー"
      >
        {state === 'Copied' ? '✓ コピー済み' : 'コピー'}
      </button>
    </header>

    <!--
      CodeMirrorWrapper manages the EditorView lifecycle.
      It renders the frontmatter region (blue bg) + body region.
      bind:editorView exposes the EditorView instance for copy/focus.
      No <input> or <textarea> title fields are present (NNC-E2).
    -->
    <div class="editor-codemirror-area">
      <svelte:component
        this={CodeMirrorWrapper}
        {filename}
        initialContent={buildFullContent(tags, body)}
        bind:editorView
        on:change={(e) => handleDocChange(e.detail.body)}
      />
    </div>

    <!-- TagInput below the CodeMirror area -->
    <div class="editor-tag-area">
      <svelte:component
        this={TagInput}
        bind:tags
        on:change={(e) => handleTagsChange(e.detail.tags)}
      />
    </div>
  </div>
{/if}

<style>
  .editor-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    background-color: var(--color-bg, #ffffff);
  }

  .editor-root--error {
    padding: 1rem;
  }

  /* Header bar: back button on the left, status in centre, copy button on the right */
  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    flex-shrink: 0;
    gap: 0.5rem;
  }

  .back-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    color: var(--color-text, #111827);
  }

  .back-btn:hover {
    background-color: var(--color-hover, #f3f4f6);
  }

  .header-status {
    flex: 1;
    text-align: center;
  }

  .status-label {
    font-size: 0.75rem;
    color: var(--color-text-muted, #6b7280);
  }

  .status-label--saving {
    color: var(--color-blue, #3b82f6);
  }

  .status-label--error {
    color: var(--color-red, #ef4444);
  }

  .status-label--creating {
    color: var(--color-green, #10b981);
  }

  /* 1-click copy button */
  .copy-btn {
    padding: 0.35rem 0.85rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 6px;
    background-color: var(--color-bg, #ffffff);
    cursor: pointer;
    font-size: 0.85rem;
    white-space: nowrap;
    color: var(--color-text, #111827);
    transition: background-color 120ms ease, color 120ms ease;
    flex-shrink: 0;
  }

  .copy-btn:hover:not(:disabled) {
    background-color: var(--color-hover, #f3f4f6);
  }

  .copy-btn--copied {
    background-color: var(--color-green, #10b981);
    color: #ffffff;
    border-color: var(--color-green, #10b981);
  }

  .copy-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* CodeMirror area fills remaining vertical space */
  .editor-codemirror-area {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* TagInput pinned at bottom */
  .editor-tag-area {
    flex-shrink: 0;
    border-top: 1px solid var(--color-border, #e5e7eb);
    padding: 0.5rem 1rem;
    background-color: var(--color-bg, #ffffff);
  }

  /* Loading/error placeholders */
  .editor-body-placeholder,
  .tag-input-placeholder {
    background-color: var(--color-placeholder, #f9fafb);
  }

  .editor-body-placeholder {
    flex: 1;
  }

  .tag-input-placeholder {
    height: 3rem;
    border-top: 1px solid var(--color-border, #e5e7eb);
  }

  .error-message {
    color: var(--color-red, #ef4444);
    margin-top: 1rem;
  }
</style>

<script context="module" lang="ts">
  /**
   * Builds the full .md document string (frontmatter + body) for CodeMirror.
   * Kept here so CodeMirrorWrapper can receive a single string and owns only
   * the editor mechanics, while EditorRoot owns the data model.
   */
  export function buildFullContent(tags: string[], body: string): string {
    const tagsYaml =
      tags.length > 0
        ? `tags:\n${tags.map((t) => `  - ${t}`).join('\n')}`
        : 'tags: []';
    return `---\n${tagsYaml}\n---\n${body}`;
  }

  // CodeMirrorWrapper and TagInput are resolved at runtime via the host app's
  // component registry. Import aliases are declared here for documentation;
  // the consuming route wires up the actual components.
  import type { SvelteComponent } from 'svelte';
  let CodeMirrorWrapper: typeof SvelteComponent;
  let TagInput: typeof SvelteComponent;
</script>
