<script lang="ts">
  import type { NoteMetadata } from "$lib/shell/tauri-commands";
  import { readNote } from "$lib/shell/tauri-commands";
  import { formatDisplayDate } from "$lib/storage/timestamp";
  import NoteEditor from "./NoteEditor.svelte";
  import CopyButton from "./CopyButton.svelte";
  import DeleteButton from "./DeleteButton.svelte";
  import { removeNote } from "$lib/feed/notes";
  import { extractBody } from "$lib/editor/frontmatter";

  interface EditorApi {
    getRawContent(): string;
  }

  interface Props {
    note: NoteMetadata;
    matchedLine?: string;
    isEditing: boolean;
    isFocused?: boolean;
    onClick: () => void;
    onExit?: (filename: string) => void;
  }

  let { note, matchedLine, isEditing, isFocused = false, onClick, onExit }: Props = $props();

  let editorApi: EditorApi | null = $state(null);

  function handleCardClick(event: MouseEvent) {
    if (isEditing) return;
    event.stopPropagation();
    onClick();
  }

  function handleCardKeydown(event: KeyboardEvent) {
    if (isEditing) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  function handleActionsClick(event: MouseEvent) {
    event.stopPropagation();
  }

  async function handleCopyGetContent(): Promise<string> {
    if (isEditing && editorApi) {
      return extractBody(editorApi.getRawContent());
    }
    const raw = await readNote(note.filename);
    return extractBody(raw);
  }

  function handleDeleted() {
    removeNote(note.filename);
  }
</script>

<div
  class="note-card"
  class:editing={isEditing}
  onclick={handleCardClick}
  onkeydown={handleCardKeydown}
  role="button"
  tabindex="0"
  data-testid="note-card"
  data-focused={isFocused ? "true" : undefined}
  aria-label="Note {note.filename}"
>
  <div class="note-card-header">
    <span class="note-date">{formatDisplayDate(note.created_at)}</span>
    {#if note.tags.length > 0}
      <div class="note-tags">
        {#each note.tags as tag}
          <span class="tag">{tag}</span>
        {/each}
      </div>
    {/if}
    <div class="note-actions" onclick={handleActionsClick} role="presentation">
      <CopyButton getContent={handleCopyGetContent} />
      <DeleteButton filename={note.filename} onDeleted={handleDeleted} />
    </div>
  </div>

  {#if isEditing}
    <NoteEditor
      filename={note.filename}
      bind:api={editorApi}
      onExit={() => onExit?.(note.filename)}
    />
  {:else if matchedLine}
    <p class="note-body">{matchedLine}</p>
  {:else}
    <p class="note-body">{note.body_preview || "(empty)"}</p>
  {/if}
</div>

<style>
  .note-card {
    display: block;
    width: 100%;
    text-align: left;
    padding: 12px;
    margin-bottom: 8px;
    border-radius: var(--radius);
    background: var(--surface);
    transition: background 0.15s;
    cursor: pointer;
  }
  .note-card:hover:not(.editing) {
    background: var(--surface-secondary);
  }
  .note-card.editing {
    cursor: text;
    background: var(--surface-secondary);
  }
  .note-card[data-focused="true"] {
    background: var(--surface-focus, var(--surface-secondary));
  }
  .note-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
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
  .note-actions {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }
  .note-body {
    font-size: 0.9rem;
    color: var(--text);
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }
</style>
