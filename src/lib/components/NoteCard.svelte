<script lang="ts">
  import type { NoteEntry } from '$lib/types';
  import { formatRelativeTime } from '$lib/date-utils';

  let { note, onClick, onDelete }:
    { note: NoteEntry; onClick: () => void; onDelete: () => void }
    = $props();
</script>

<div class="note-card" role="button" tabindex="0" onclick={onClick} onkeydown={(e) => { if (e.key === 'Enter') onClick(); }}>
  <div class="card-body">
    <p class="card-preview">{note.body_preview}</p>
  </div>
  <div class="card-footer">
    <div class="card-meta">
      <span class="card-time">{formatRelativeTime(note.created_at)}</span>
      {#if note.tags.length > 0}
        <div class="card-tags">
          {#each note.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}
    </div>
    <button class="card-delete" onclick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete note">×</button>
  </div>
</div>

<style>
  .note-card {
    break-inside: avoid;
    margin-bottom: 16px;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 14px;
    cursor: pointer;
    transition: border-color 0.15s, transform 0.1s;
  }

  .note-card:hover {
    border-color: var(--color-primary);
    transform: translateY(-1px);
  }

  .card-preview {
    font-size: 13px;
    line-height: 1.5;
    color: var(--color-text);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow: hidden;
  }

  .card-footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--color-border);
  }

  .card-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-time {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag {
    font-size: 11px;
    padding: 2px 6px;
    background-color: rgba(137, 180, 250, 0.12);
    color: var(--color-primary);
    border-radius: var(--radius-sm);
  }

  .card-delete {
    font-size: 16px;
    color: var(--color-text-muted);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    opacity: 0;
    transition: opacity 0.15s, color 0.15s;
  }

  .note-card:hover .card-delete {
    opacity: 1;
  }

  .card-delete:hover {
    color: var(--color-danger);
  }
</style>
