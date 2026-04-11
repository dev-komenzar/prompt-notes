<script lang="ts">
  import { goto } from '$app/navigation';

  interface Props {
    title?: string;
    showBack?: boolean;
    showSettings?: boolean;
    showNew?: boolean;
  }

  let {
    title = 'PromptNotes',
    showBack = false,
    showSettings = false,
    showNew = false
  }: Props = $props();

  function handleBack() {
    goto('/');
  }

  function handleSettings() {
    goto('/settings');
  }

  function handleNew() {
    goto('/new');
  }
</script>

<header class="top-bar">
  <div class="top-bar-left">
    {#if showBack}
      <button
        class="top-btn"
        onclick={handleBack}
        title="戻る"
        data-testid="nav-grid"
        type="button"
      >
        ← 戻る
      </button>
    {/if}
    <h1 class="top-title">{title}</h1>
  </div>
  <div class="top-bar-right">
    {#if showNew}
      <button
        class="top-btn new-btn"
        onclick={handleNew}
        title="新規ノート (Cmd+N)"
        data-testid="nav-editor"
        type="button"
      >
        ＋ 新規
      </button>
    {/if}
    {#if showSettings}
      <button
        class="top-btn"
        onclick={handleSettings}
        title="設定"
        data-testid="nav-settings"
        type="button"
      >
        ⚙
      </button>
    {/if}
  </div>
</header>

<style>
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    min-height: 48px;
    -webkit-app-region: drag;
  }

  .top-bar-left,
  .top-bar-right {
    display: flex;
    align-items: center;
    gap: 12px;
    -webkit-app-region: no-drag;
  }

  .top-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text);
  }

  .top-btn {
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    color: var(--color-text-secondary);
    transition: all var(--transition-fast);
  }

  .top-btn:hover {
    background: var(--color-bg-secondary);
    color: var(--color-text);
  }

  .new-btn {
    color: var(--color-primary);
    font-weight: 500;
  }

  .new-btn:hover {
    background: rgba(137, 180, 250, 0.15);
  }
</style>
