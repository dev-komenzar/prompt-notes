<!-- Sprint 14 – Top toolbar with navigation and actions -->
<script lang="ts">
  import { currentView, newNote } from "../lib/stores";
  import type { ViewName } from "../lib/types";

  function navigate(view: ViewName) {
    currentView.set(view);
  }

  function handleNewNote() {
    newNote();
  }
</script>

<nav class="toolbar">
  <div class="toolbar-left">
    <span class="app-title">PromptNotes</span>
  </div>
  <div class="toolbar-center">
    <button
      class="nav-btn"
      class:active={$currentView === "grid"}
      on:click={() => navigate("grid")}
      title="Grid View"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
      <span>Grid</span>
    </button>
    <button
      class="nav-btn"
      class:active={$currentView === "editor"}
      on:click={() => navigate("editor")}
      title="Editor"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
      <span>Editor</span>
    </button>
    <button
      class="nav-btn"
      class:active={$currentView === "settings"}
      on:click={() => navigate("settings")}
      title="Settings"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
      <span>Settings</span>
    </button>
  </div>
  <div class="toolbar-right">
    <button class="action-btn new-note-btn" on:click={handleNewNote} title="New Note (Ctrl+N)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      <span>New</span>
    </button>
  </div>
</nav>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--toolbar-height);
    padding: 0 16px;
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
    -webkit-app-region: drag;
  }

  .toolbar-left, .toolbar-center, .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    -webkit-app-region: no-drag;
  }

  .app-title {
    font-weight: 600;
    font-size: 14px;
    color: var(--text-primary);
    letter-spacing: 0.5px;
  }

  .nav-btn, .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .nav-btn:hover, .action-btn:hover {
    background-color: var(--bg-surface);
    color: var(--text-primary);
  }

  .nav-btn.active {
    background-color: var(--bg-surface);
    color: var(--accent-color);
  }

  .new-note-btn {
    background-color: var(--accent-color);
    color: var(--bg-primary);
    font-weight: 600;
  }

  .new-note-btn:hover {
    background-color: var(--accent-hover);
    color: var(--bg-primary);
  }
</style>
