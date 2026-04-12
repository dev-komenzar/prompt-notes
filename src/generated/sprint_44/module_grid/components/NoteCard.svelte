<script lang="ts">
  // @codd-trace: detail:grid_search §4.2
  // RBC-GRID-3: カードクリック → エディタ遷移必須

  import { mark, PERF_MARKS } from '../perf';
  import type { NoteMetadata } from '../types';

  export let note: NoteMetadata;

  function handleClick(): void {
    mark(PERF_MARKS.CARD_CLICK);
    // svelte-spa-router ハッシュルーティング: EditorView が ?note= を読み取る
    window.location.hash = `#/?note=${encodeURIComponent(note.id)}`;
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  function formatDate(isoDate: string): string {
    try {
      const d = new Date(isoDate);
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return isoDate;
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="note-card"
  on:click={handleClick}
  on:keydown={handleKeydown}
  role="button"
  tabindex="0"
  aria-label="ノートを開く"
>
  <p class="preview">{note.preview}</p>
  {#if note.tags.length > 0}
    <div class="tags" aria-label="タグ">
      {#each note.tags as tag}
        <span class="tag">#{tag}</span>
      {/each}
    </div>
  {/if}
  <time class="created-at" datetime={note.created_at}>{formatDate(note.created_at)}</time>
</div>

<style>
  .note-card {
    break-inside: avoid;
    margin-bottom: 16px;
    border-radius: 8px;
    background: var(--card-bg, #ffffff);
    border: 1px solid var(--card-border, #e5e7eb);
    padding: 16px;
    cursor: pointer;
    transition: box-shadow 0.15s ease, transform 0.1s ease;
    display: block;
    width: 100%;
    text-align: left;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }

  .note-card:focus-visible {
    outline: 2px solid var(--color-focus, #3b82f6);
    outline-offset: 2px;
  }

  .preview {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-primary, #111827);
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0 0 12px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }

  .tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 12px;
    background: var(--tag-bg, #eff6ff);
    color: var(--tag-color, #2563eb);
    font-weight: 500;
  }

  .created-at {
    font-size: 11px;
    color: var(--text-secondary, #9ca3af);
    display: block;
  }
</style>
