<script lang="ts">
  interface Props {
    onNewNote: () => void;
    onOpenSettings: () => void;
  }

  let { onNewNote, onOpenSettings }: Props = $props();
</script>

<header class="header">
  <div class="header-right">
    <button
      class="header-btn primary"
      onclick={onNewNote}
      aria-label="Create new note"
      data-testid="nav-editor"
    >
      + New Note
    </button>
    <button
      class="header-btn"
      onclick={onOpenSettings}
      aria-label="Open settings"
      data-testid="nav-settings"
    >
      Settings
    </button>
  </div>
</header>

<style>
  .header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    min-height: 48px;
    flex-shrink: 0;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .header-btn {
    padding: 6px 12px;
    border-radius: var(--radius);
    font-size: 0.875rem;
    transition: background 0.15s;
    border: 1px solid var(--border);
  }
  .header-btn:hover {
    background: var(--surface-secondary);
  }
  .header-btn.primary {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }
  .header-btn.primary:hover {
    background: var(--accent-hover);
  }
</style>
