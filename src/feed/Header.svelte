<script lang="ts">
  import SearchBar from "./SearchBar.svelte";
  import { debounce } from "../shell/debounce";
  import { setQuery } from "./filters";
  import { searchNotesAction, loadNotes } from "./notes";

  interface Props {
    onNewNote: () => void;
    onOpenSettings: () => void;
  }

  let { onNewNote, onOpenSettings }: Props = $props();

  const debouncedSearch = debounce((q: string) => {
    setQuery(q);
    if (q.trim()) {
      searchNotesAction(q);
    } else {
      loadNotes();
    }
  }, 300);

  function handleKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === "n") {
      event.preventDefault();
      onNewNote();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<header class="header" data-testid="header">
  <div class="header-left">
    <h1 class="app-title">PromptNotes</h1>
  </div>
  <div class="header-center">
    <SearchBar onSearch={debouncedSearch} />
  </div>
  <div class="header-right">
    <button
      class="btn btn-primary"
      data-testid="new-note-button"
      on:click={onNewNote}
      title="New note (Cmd+N / Ctrl+N)"
    >
      + New
    </button>
    <button
      class="btn btn-icon"
      data-testid="settings-button"
      on:click={onOpenSettings}
      title="Settings"
    >
      ⚙
    </button>
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    height: var(--header-height);
    padding: 0 16px;
    border-bottom: 1px solid var(--border);
    gap: 16px;
    flex-shrink: 0;
  }

  .header-left {
    flex-shrink: 0;
  }

  .app-title {
    font-size: 18px;
    font-weight: 600;
  }

  .header-center {
    flex: 1;
    max-width: 480px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .btn {
    padding: 6px 14px;
    border-radius: var(--radius);
    font-size: 14px;
    transition: background var(--transition-fast);
  }

  .btn-primary {
    background: var(--accent);
    color: #fff;
  }

  .btn-primary:hover {
    background: var(--accent-hover);
  }

  .btn-icon {
    font-size: 18px;
    padding: 6px 8px;
    border-radius: var(--radius);
  }

  .btn-icon:hover {
    background: var(--surface-hover);
  }
</style>
