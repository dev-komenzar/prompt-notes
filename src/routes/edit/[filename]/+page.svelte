<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import TopBar from '$lib/components/TopBar.svelte';
  import Editor from '$lib/components/Editor.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import { readNote, saveNote } from '$lib/api';
  import { extractBody, parseTags } from '$lib/utils/frontmatter';
  import { formatDisplayDate } from '$lib/utils/date-utils';

  let editor: Editor | undefined = $state();
  let content = $state('');
  let loading = $state(true);
  let error = $state<string | null>(null);
  let saving = $state(false);

  const filename = $derived(decodeURIComponent($page.params.filename));

  onMount(async () => {
    try {
      const result = await readNote(filename);
      content = result.raw;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  });

  async function handleSave(rawContent: string) {
    if (saving) return;
    saving = true;
    try {
      const tags = parseTags(rawContent);
      const body = extractBody(rawContent);
      await saveNote(filename, body, tags);
    } catch (e) {
      console.error('Save failed:', e);
    } finally {
      saving = false;
    }
  }

  function handleNewNote(): boolean {
    goto('/new');
    return true;
  }

  function getRawContent(): string {
    return editor?.getContent() ?? content;
  }
</script>

<TopBar title={formatDisplayDate(filename)} showBack />

<div class="editor-toolbar">
  <div class="toolbar-left">
    {#if saving}
      <span class="save-indicator">保存中...</span>
    {/if}
    <span class="filename-display">{filename}</span>
  </div>
  <div class="toolbar-right">
    <CopyButton {getRawContent} />
  </div>
</div>

{#if loading}
  <div class="loading">読み込み中...</div>
{:else if error}
  <div class="error">エラー: {error}</div>
{:else}
  <Editor
    bind:this={editor}
    {content}
    onSave={handleSave}
    onNewNote={handleNewNote}
  />
{/if}

<style>
  .editor-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 16px;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .save-indicator {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .filename-display {
    font-size: 12px;
    color: var(--color-text-muted);
    font-family: var(--font-mono);
  }

  .loading,
  .error {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 48px;
    color: var(--color-text-muted);
    flex: 1;
  }

  .error {
    color: var(--color-danger);
  }
</style>
