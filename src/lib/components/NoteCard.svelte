<script lang="ts">
  import type { NoteEntry } from '../types';
  import { formatDisplayDate } from '../utils/date-utils';
  import { copyToClipboard } from '../utils/clipboard';
  import { goto } from '$app/navigation';

  interface Props {
    note: NoteEntry;
    onDelete: (filename: string) => void;
  }

  let { note, onDelete }: Props = $props();
  let copied = $state(false);

  function handleOpen() {
    goto(`/edit/${encodeURIComponent(note.filename)}`);
  }

  async function handleCopy(e: MouseEvent) {
    e.stopPropagation();
    const ok = await copyToClipboard(note.body_preview);
    if (ok) {
      copied = true;
      setTimeout(() => (copied = false), 1500);
    }
  }

  function handleDelete(e: MouseEvent) {
    e.stopPropagation();
    onDelete(note.filename);
  }
</script>

<div class="note-card" onclick={handleOpen} onkeydown={(e) => e.key === 'Enter' && handleOpen()} role="button" tabindex="0">
  <div class="card-header">
    <time class="card-date">{formatDisplayDate(note.filename)}</time>
    <div class="card-actions">
      <button
        class="action-btn copy-btn"
        onclick={handleCopy}
        title="コピー"
        type="button"
      >
        {copied ? '✓' : '📋'}
      </button>
      <button
        class="action-btn delete-btn"
        onclick={handleDelete}
        title="削除"
        type="button"
      >
        🗑
      </button>
    </div>
  </div>

  <div class="card-body">
    <p class="card-preview">{note.body_preview}</p>
  </div>

  {#if note.tags.length > 0}
    <div class="card-tags">
      {#each note.tags as tag}
        <span class="tag">#{tag}</span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .note-card {
    display: flex;
    flex-direction: column;
    background: var(--color-card-bg);
    border-radius: var(--radius-md);
    padding: 16px;
    cursor: pointer;
    transition: background var(--transition-fast), box-shadow var(--transition-fast);
    box-shadow: var(--shadow-card);
    text-align: left;
    width: 100%;
    border: 1px solid transparent;
  }

  .note-card:hover {
    background: var(--color-card-hover);
    border-color: var(--color-border);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .card-date {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .card-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  .note-card:hover .card-actions {
    opacity: 1;
  }

  .action-btn {
    padding: 4px 6px;
    border-radius: var(--radius-sm);
    font-size: 14px;
    transition: background var(--transition-fast);
  }

  .action-btn:hover {
    background: var(--color-bg-tertiary);
  }

  .delete-btn:hover {
    background: rgba(243, 139, 168, 0.2);
  }

  .card-body {
    flex: 1;
    margin-bottom: 8px;
  }

  .card-preview {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.5;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag {
    font-size: 11px;
    color: var(--color-tag);
    background: rgba(148, 226, 213, 0.1);
    padding: 2px 8px;
    border-radius: 12px;
  }
</style>
