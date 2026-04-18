<script lang="ts">
  interface Props {
    onNewNote: () => void;
    onOpenSettings: () => void;
    onBack?: (() => void) | undefined;
    showBack: boolean;
  }

  let { onNewNote, onOpenSettings, onBack, showBack }: Props = $props();
</script>

<header class="header">
  <div class="header-left">
    {#if showBack && onBack}
      <button class="header-btn" onclick={onBack} aria-label="Back to feed">
        ← Back
      </button>
    {/if}
    <button
      class="header-title-btn"
      onclick={onBack ?? (() => {})}
      aria-label="Grid view"
      data-testid="nav-grid"
    >
      <h1 class="header-title">PromptNotes</h1>
    </button>
  </div>
  <div class="header-right">
    <button class="header-btn primary" onclick={onNewNote} aria-label="Create new note" data-testid="nav-editor">
      + New Note
    </button>
    <button class="header-btn" onclick={onOpenSettings} aria-label="Open settings" data-testid="nav-settings">
      Settings
    </button>
  </div>
</header>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    min-height: 48px;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .header-title-btn {
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
  }
  .header-title {
    font-size: 1.1rem;
    font-weight: 600;
  }
  .header-btn {
    padding: 6px 12px;
    border-radius: var(--radius);
    font-size: 0.875rem;
    transition: background 0.15s;
  }
  .header-btn:hover {
    background: var(--surface-secondary);
  }
  .header-btn.primary {
    background: var(--accent);
    color: white;
  }
  .header-btn.primary:hover {
    background: var(--accent-hover);
  }
</style>
