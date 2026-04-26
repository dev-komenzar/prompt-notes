<script lang="ts">
  import NoteEditor from "./NoteEditor.svelte";
  import CopyButton from "./CopyButton.svelte";
  import DeleteButton from "./DeleteButton.svelte";
  import type { NoteMetadata } from "../shell/tauri-commands";
  import { formatDisplayDate } from "../storage/timestamp";
  import { focusedIndex } from "./focus";

  interface Props {
    note: NoteMetadata;
    snippet?: string;
    focused: boolean;
    editing: boolean;
    onEdit: () => void;
    onExitEdit: () => void;
    index: number;
  }

  let { note, snippet, focused, editing, onEdit, onExitEdit, index }: Props =
    $props();

  let cardEl: HTMLElement;

  $effect(() => {
    if (focused && cardEl) {
      cardEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });

  function handleCardClick() {
    focusedIndex.set(index);
    if (!editing) {
      onEdit();
    }
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !editing) {
      event.preventDefault();
      onEdit();
    }
  }
</script>

<article
  bind:this={cardEl}
  class="note-card"
  class:focused
  class:editing
  data-testid="note-card"
  data-focused={focused}
  data-filename={note.filename}
  tabindex="0"
  role="article"
  on:click={handleCardClick}
  on:keydown={handleCardKeydown}
>
  {#if editing}
    <NoteEditor filename={note.filename} onSave={onExitEdit} />
  {:else}
    <div class="card-body">
      <div class="card-tags">
        {#each note.tags as tag (tag)}
          <span class="tag">{tag}</span>
        {/each}
      </div>
      <p class="card-preview">
        {#if snippet}
          {@html snippet}
        {:else}
          {note.body_preview}
        {/if}
      </p>
    </div>
    <div class="card-footer">
      <span class="card-date">{formatDisplayDate(note.updated_at)}</span>
      <div class="card-actions">
        <CopyButton filename={note.filename} />
        <DeleteButton filename={note.filename} />
      </div>
    </div>
  {/if}
</article>

<style>
  .note-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--card-shadow);
    overflow: hidden;
    transition: box-shadow var(--transition-normal),
      border-color var(--transition-normal);
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }

  .note-card:hover {
    box-shadow: var(--card-shadow-hover);
  }

  .note-card.focused {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--accent);
  }

  .note-card.editing {
    cursor: default;
  }

  .card-body {
    padding: 12px;
    flex: 1;
  }

  .card-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .card-tags:empty {
    display: none;
  }

  .tag {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 10px;
    background: var(--surface-hover);
    color: var(--text-secondary);
  }

  .card-preview {
    font-size: 13px;
    line-height: 1.5;
    color: var(--text);
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow: hidden;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-top: 1px solid var(--border);
    font-size: 12px;
  }

  .card-date {
    color: var(--text-secondary);
  }

  .card-actions {
    display: flex;
    gap: 4px;
  }
</style>
