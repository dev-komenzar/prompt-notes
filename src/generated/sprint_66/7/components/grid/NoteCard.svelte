<!-- @generated-from: docs/detailed_design/grid_search_design.md §4.2 -->
<!-- カードクリックで /?note={id} へルーター遷移 (RBC-GRID-3)。
     IPC 呼び出しは行わない。表示データは NoteMetadata のみ。 -->
<script lang="ts">
  import { push } from 'svelte-spa-router';
  import type { NoteMetadata } from '../../lib/types';

  export let note: NoteMetadata;

  function handleClick() {
    push(`/?note=${encodeURIComponent(note.id)}`);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  function formatDate(isoDate: string): string {
    // ファイル名由来の created_at は "2026-04-11T14:30:52" 形式
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate.slice(0, 10);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class="note-card"
  on:click={handleClick}
  on:keydown={handleKeydown}
  role="button"
  tabindex="0"
  aria-label={`ノート ${note.id} を開く`}
>
  {#if note.preview}
    <p class="preview">{note.preview}</p>
  {:else}
    <p class="preview empty">（空のノート）</p>
  {/if}

  {#if note.tags.length > 0}
    <div class="tags" aria-label="タグ">
      {#each note.tags as tag (tag)}
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
    border: 1px solid var(--border-color, #e5e7eb);
    padding: 16px;
    cursor: pointer;
    transition: box-shadow 0.2s ease, transform 0.15s ease;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  .note-card:focus {
    outline: 2px solid var(--focus-color, #3b82f6);
    outline-offset: 2px;
  }

  .preview {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-color, #1f2937);
    margin: 0 0 10px 0;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .preview.empty {
    color: var(--muted-color, #9ca3af);
    font-style: italic;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }

  .tag {
    padding: 2px 8px;
    border-radius: 9999px;
    background: var(--tag-bg, #eff6ff);
    color: var(--tag-color, #1d4ed8);
    font-size: 12px;
    font-weight: 500;
  }

  .created-at {
    display: block;
    font-size: 12px;
    color: var(--muted-color, #9ca3af);
    margin-top: 4px;
  }
</style>
