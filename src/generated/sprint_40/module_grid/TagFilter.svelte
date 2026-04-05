<!-- CoDD Traceability: sprint:40 task:40-1 module:grid detail:grid_search CONV-GRID-2 -->
<!-- Tag filter component. Presentational only — does not call IPC. Dispatches tag-change to parent. -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  /** All available tags collected from current NoteEntry set. */
  export let availableTags: string[] = [];

  /** Currently selected tag, or null for "all". */
  export let selectedTag: string | null = null;

  const dispatch = createEventDispatcher<{
    'tag-change': { tag: string | null };
  }>();

  function selectTag(tag: string | null): void {
    dispatch('tag-change', { tag });
  }
</script>

<div class="tag-filter" role="group" aria-label="タグフィルタ">
  <button
    class="tag-filter__chip"
    class:tag-filter__chip--active={selectedTag === null}
    on:click={() => selectTag(null)}
    type="button"
  >
    すべて
  </button>

  {#each availableTags as tag (tag)}
    <button
      class="tag-filter__chip"
      class:tag-filter__chip--active={selectedTag === tag}
      on:click={() => selectTag(tag)}
      type="button"
    >
      {tag}
    </button>
  {/each}
</div>

<style>
  .tag-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }

  .tag-filter__chip {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid var(--chip-border, #cbd5e1);
    border-radius: 9999px;
    background: var(--chip-bg, transparent);
    color: var(--chip-color, #475569);
    cursor: pointer;
    transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
    line-height: 1.4;
  }

  .tag-filter__chip:hover {
    background: var(--chip-hover-bg, #f1f5f9);
  }

  .tag-filter__chip--active {
    background: var(--chip-active-bg, #3b82f6);
    color: var(--chip-active-color, #ffffff);
    border-color: var(--chip-active-border, #3b82f6);
  }

  .tag-filter__chip--active:hover {
    background: var(--chip-active-hover-bg, #2563eb);
  }
</style>
