<script lang="ts">
  // @codd-trace: detail:grid_search §4.2, RBC-GRID-3
  // カードクリックでエディタ画面へ遷移 (RBC-GRID-3 準拠)。
  // IPC 呼び出しは行わない — データ取得は GridView に一元化。
  import { push } from 'svelte-spa-router';
  import type { NoteMetadata } from '../../lib/types';

  export let note: NoteMetadata;

  function navigate() {
    push(`/?note=${encodeURIComponent(note.id)}`);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate();
    }
  }

  function formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd}`;
  }
</script>

<div
  class="note-card"
  on:click={navigate}
  on:keydown={handleKeydown}
  role="button"
  tabindex="0"
  aria-label="ノートを開く: {note.preview.slice(0, 30)}"
>
  <p class="preview">{note.preview}</p>
  {#if note.tags.length > 0}
    <div class="tags" aria-label="タグ">
      {#each note.tags as tag}
        <span class="tag">{tag}</span>
      {/each}
    </div>
  {/if}
  <time class="created-at" datetime={note.created_at}>
    {formatDate(note.created_at)}
  </time>
</div>

<style>
  .note-card {
    break-inside: avoid;
    margin-bottom: 16px;
    border-radius: 8px;
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--border-color, #e2e8f0);
    padding: 16px;
    cursor: pointer;
    transition: box-shadow 0.2s ease, transform 0.1s ease;
    outline: none;
  }
  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
  .note-card:focus-visible {
    box-shadow: 0 0 0 3px var(--focus-color, #4299e1);
  }
  .preview {
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-color, #2d3748);
    margin: 0 0 10px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }
  .tag {
    padding: 2px 8px;
    border-radius: 10px;
    background: var(--tag-bg, #ebf4ff);
    color: var(--tag-color, #3182ce);
    font-size: 11px;
  }
  .created-at {
    font-size: 11px;
    color: var(--muted-color, #a0aec0);
    display: block;
  }
</style>
