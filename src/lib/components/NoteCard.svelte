<script lang="ts">
  import type { NoteMetadata } from "$lib/utils/tauri-commands";
  import { formatDisplayDate } from "$lib/utils/timestamp";

  interface Props {
    note: NoteMetadata;
    matchedLine?: string;
    onOpen: () => void;
  }

  let { note, matchedLine, onOpen }: Props = $props();
</script>

<button class="note-card" onclick={onOpen} aria-label="Open note {note.filename}" data-testid="note-card">
  <div class="note-card-header">
    <span class="note-date">{formatDisplayDate(note.created_at)}</span>
    {#if note.tags.length > 0}
      <div class="note-tags">
        {#each note.tags as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>
    {/if}
  </div>
  <p class="note-preview">
    {#if matchedLine}
      {matchedLine}
    {:else}
      {note.body_preview || "(empty)"}
    {/if}
  </p>
</button>

<style>
  .note-card {
    display: block;
    width: 100%;
    text-align: left;
    padding: 12px;
    margin-bottom: 4px;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    transition: background 0.15s;
  }
  .note-card:hover {
    background: var(--surface-secondary);
  }
  .note-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  .note-date {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
  .note-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .tag {
    background: var(--tag-bg);
    color: var(--tag-text);
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 3px;
  }
  .note-preview {
    font-size: 0.9rem;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
