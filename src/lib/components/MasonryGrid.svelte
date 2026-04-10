<script lang="ts">
  import type { NoteEntry } from '../types';
  import NoteCard from './NoteCard.svelte';

  interface Props {
    notes: NoteEntry[];
    onDelete: (filename: string) => void;
  }

  let { notes, onDelete }: Props = $props();
</script>

<div class="masonry-grid">
  {#each notes as note (note.filename)}
    <div class="grid-item">
      <NoteCard {note} {onDelete} />
    </div>
  {/each}
</div>

{#if notes.length === 0}
  <div class="empty-state">
    <p>ノートがありません</p>
    <p class="empty-hint">Cmd+N / Ctrl+N で新しいノートを作成できます</p>
  </div>
{/if}

<style>
  .masonry-grid {
    columns: 3;
    column-gap: var(--grid-gap);
    padding: var(--grid-gap);
  }

  .grid-item {
    break-inside: avoid;
    margin-bottom: var(--grid-gap);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 16px;
    color: var(--color-text-muted);
  }

  .empty-hint {
    margin-top: 8px;
    font-size: 13px;
  }

  @media (max-width: 900px) {
    .masonry-grid {
      columns: 2;
    }
  }

  @media (max-width: 600px) {
    .masonry-grid {
      columns: 1;
    }
  }
</style>
