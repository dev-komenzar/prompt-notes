<!-- Sprint 18 – Note card for grid view masonry layout -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { NoteEntry } from "../lib/types";
  import { formatRelativeTime } from "../lib/date-utils";
  import { copyToClipboard } from "../lib/clipboard";
  import { extractBody } from "../lib/frontmatter";
  import { addToast } from "../lib/stores";

  export let note: NoteEntry;

  const dispatch = createEventDispatcher<{ click: { filename: string } }>();

  function handleClick() {
    dispatch("click", { filename: note.filename });
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }

  async function handleCopyClick(e: MouseEvent) {
    e.stopPropagation();
    // For the card, we copy the preview/body text
    const ok = await copyToClipboard(note.preview || note.title);
    if (ok) {
      addToast("success", "Copied to clipboard");
    } else {
      addToast("error", "Failed to copy");
    }
  }
</script>

<div
  class="note-card"
  role="button"
  tabindex="0"
  on:click={handleClick}
  on:keydown={handleKeyDown}
>
  <div class="card-header">
    <span class="card-time">{formatRelativeTime(note.created_at)}</span>
    <button class="card-copy-btn" on:click={handleCopyClick} title="Copy note">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </svg>
    </button>
  </div>
  {#if note.title}
    <h3 class="card-title">{note.title}</h3>
  {/if}
  {#if note.preview}
    <p class="card-preview">{note.preview}</p>
  {/if}
  {#if note.tags.length > 0}
    <div class="card-tags">
      {#each note.tags as tag}
        <span class="tag">{tag}</span>
      {/each}
    </div>
  {/if}
</div>

<style>
  .note-card {
    break-inside: avoid;
    margin-bottom: 16px;
    padding: 14px;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .note-card:hover {
    border-color: var(--accent-color);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .note-card:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .card-time {
    font-size: 11px;
    color: var(--text-muted);
  }

  .card-copy-btn {
    border: none;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    padding: 2px;
    border-radius: 3px;
    opacity: 0;
    transition: all 0.15s ease;
  }

  .note-card:hover .card-copy-btn {
    opacity: 1;
  }

  .card-copy-btn:hover {
    color: var(--text-primary);
    background-color: var(--bg-surface);
  }

  .card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 6px;
    line-height: 1.3;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .card-preview {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    word-break: break-word;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 10px;
  }

  .tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    background-color: var(--bg-surface);
    color: var(--accent-color);
    border: 1px solid var(--border-color);
  }
</style>
