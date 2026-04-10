<script lang="ts">
  import { goto } from '$app/navigation';
  import TopBar from '$lib/components/TopBar.svelte';
  import Editor from '$lib/components/Editor.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import { createNote, saveNote } from '$lib/api';
  import { generateFrontmatter, extractBody, parseTags } from '$lib/utils/frontmatter';

  let editor: Editor;
  let filename: string | null = null;
  let saving = $state(false);

  const initialContent = generateFrontmatter([]) + '\n';

  async function handleSave(content: string) {
    if (saving) return;
    saving = true;

    try {
      const tags = parseTags(content);
      const body = extractBody(content);

      if (!filename) {
        const result = await createNote(body, tags);
        filename = result.filename;
      } else {
        await saveNote(filename, body, tags);
      }
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
    return editor?.getContent() ?? initialContent;
  }
</script>

<TopBar title="新規ノート" showBack />

<div class="editor-toolbar">
  <div class="toolbar-left">
    {#if saving}
      <span class="save-indicator">保存中...</span>
    {/if}
  </div>
  <div class="toolbar-right">
    <CopyButton {getRawContent} />
  </div>
</div>

<Editor
  bind:this={editor}
  content={initialContent}
  onSave={handleSave}
  onNewNote={handleNewNote}
/>

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
</style>
