<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { newNote } from '$lib/stores';

  function handleNewNote() {
    newNote();
    goto('/new');
  }

  let currentPath = $derived($page.url.pathname);
</script>

<header class="header">
  <div class="header-left">
    <a href="/" class="logo">PromptNotes</a>
  </div>
  <nav class="header-nav">
    <a href="/" class:active={currentPath === '/'}>Grid</a>
    <a href="/settings" class:active={currentPath === '/settings'}>Settings</a>
  </nav>
  <div class="header-right">
    <button class="new-note-btn" onclick={handleNewNote} title="New Note (Cmd+N)">
      + New
    </button>
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    height: 48px;
    background-color: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
  }

  .logo {
    font-size: 16px;
    font-weight: 700;
    color: var(--color-primary);
    text-decoration: none;
  }

  .header-nav {
    display: flex;
    gap: 16px;
  }

  .header-nav a {
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: 14px;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    transition: color 0.15s, background-color 0.15s;
  }

  .header-nav a:hover {
    color: var(--color-text);
  }

  .header-nav a.active {
    color: var(--color-primary);
    background-color: rgba(137, 180, 250, 0.1);
  }

  .header-right {
    display: flex;
    align-items: center;
  }

  .new-note-btn {
    padding: 6px 14px;
    background-color: var(--color-primary);
    color: var(--color-bg);
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 600;
    transition: background-color 0.15s;
  }

  .new-note-btn:hover {
    background-color: var(--color-primary-hover);
  }
</style>
