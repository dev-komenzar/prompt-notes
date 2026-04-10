<!-- @generated-from: docs/detailed_design/grid_search_design.md -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { invoke } from '@tauri-apps/api/core';
  import type { NoteMetadata } from '$lib/types/note';
  import type { SearchParams } from '$lib/types/search';

  // --- filter state (mirrors gridFilter store logic) ---
  function defaultDateFrom(): string {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }

  function defaultDateTo(): string {
    return new Date().toISOString().slice(0, 10);
  }

  let query = '';
  let tags: string[] = [];
  let date_from: string = defaultDateFrom();
  let date_to: string = defaultDateTo();

  let notes: NoteMetadata[] = [];
  let loading = false;
  let error: string | null = null;

  // available tags derived from loaded notes
  let availableTags: string[] = [];

  // delete dialog state
  let deleteTarget: string | null = null;
  let showDeleteDialog = false;

  // search debounce
  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  async function fetchNotes() {
    loading = true;
    error = null;
    try {
      const params: Record<string, unknown> = {};
      if (query.trim()) params.query = query.trim();
      if (tags.length > 0) params.tags = tags;
      if (date_from) params.date_from = date_from;
      if (date_to) params.date_to = date_to;

      const result = await invoke<NoteMetadata[]>('search_notes', params);
      notes = result;

      // collect unique tags from all notes for TagFilter options
      const tagSet = new Set<string>();
      for (const note of result) {
        for (const t of note.tags) tagSet.add(t);
      }
      // also persist tags seen across previous loads
      for (const t of availableTags) tagSet.add(t);
      availableTags = Array.from(tagSet).sort();
    } catch (e) {
      error = String(e);
      notes = [];
    } finally {
      loading = false;
    }
  }

  function onQueryInput() {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      fetchNotes();
    }, 300);
  }

  function onFilterChange() {
    fetchNotes();
  }

  function onTagToggle(tag: string) {
    if (tags.includes(tag)) {
      tags = tags.filter((t) => t !== tag);
    } else {
      tags = [...tags, tag];
    }
    fetchNotes();
  }

  function onTagFromCard(tag: string) {
    if (!tags.includes(tag)) {
      tags = [...tags, tag];
      fetchNotes();
    }
  }

  function handleCardClick(filename: string) {
    goto(`/edit/${encodeURIComponent(filename)}`);
  }

  function handleDeleteRequest(filename: string) {
    deleteTarget = filename;
    showDeleteDialog = true;
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await invoke('delete_note', { filename: deleteTarget });
    } catch (e) {
      // non-fatal: log and continue
      console.error('delete_note failed:', e);
    } finally {
      deleteTarget = null;
      showDeleteDialog = false;
      fetchNotes();
    }
  }

  function cancelDelete() {
    deleteTarget = null;
    showDeleteDialog = false;
  }

  function formatDate(createdAt: string): string {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return createdAt;
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onMount(() => {
    fetchNotes();
  });

  $: deleteTargetPreview =
    deleteTarget ? (notes.find((n) => n.filename === deleteTarget)?.body_preview ?? '') : '';
</script>

<div class="grid-page">
  <!-- Filter Bar -->
  <div class="filter-bar">
    <div class="search-bar">
      <input
        type="text"
        placeholder="全文検索..."
        bind:value={query}
        on:input={onQueryInput}
        aria-label="全文検索"
      />
    </div>

    <div class="date-filter">
      <label>
        From
        <input
          type="date"
          bind:value={date_from}
          on:change={onFilterChange}
          aria-label="日付フィルタ開始"
        />
      </label>
      <label>
        To
        <input
          type="date"
          bind:value={date_to}
          on:change={onFilterChange}
          aria-label="日付フィルタ終了"
        />
      </label>
      <button
        class="reset-date-btn"
        on:click={() => {
          date_from = defaultDateFrom();
          date_to = defaultDateTo();
          onFilterChange();
        }}
        title="直近7日間にリセット"
      >
        直近7日
      </button>
    </div>

    {#if availableTags.length > 0}
      <div class="tag-filter" role="group" aria-label="タグフィルタ">
        {#each availableTags as tag (tag)}
          <button
            class="tag-chip"
            class:active={tags.includes(tag)}
            on:click={() => onTagToggle(tag)}
          >
            {tag}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Loading Indicator -->
  {#if loading}
    <div class="loading-indicator" aria-live="polite" aria-label="読み込み中">
      <span class="spinner" aria-hidden="true"></span>
      <span>読み込み中...</span>
    </div>
  {/if}

  <!-- Error State -->
  {#if error && !loading}
    <div class="error-message" role="alert">
      エラーが発生しました: {error}
    </div>
  {/if}

  <!-- Empty State -->
  {#if !loading && !error && notes.length === 0}
    <div class="empty-state" role="status">
      この期間のノートはありません。日付フィルタを変更してください。
    </div>
  {/if}

  <!-- Masonry Grid -->
  {#if !loading && notes.length > 0}
    <div class="masonry-grid">
      {#each notes as note (note.filename)}
        <div
          class="note-card"
          role="button"
          tabindex="0"
          on:click={() => handleCardClick(note.filename)}
          on:keydown={(e) => e.key === 'Enter' && handleCardClick(note.filename)}
          aria-label="ノートを開く"
        >
          <div class="card-body-preview">{note.body_preview}</div>

          {#if note.tags.length > 0}
            <div class="card-tags">
              {#each note.tags as tag (tag)}
                <button
                  class="tag-chip small"
                  on:click|stopPropagation={() => onTagFromCard(tag)}
                  aria-label="タグでフィルタ: {tag}"
                >
                  {tag}
                </button>
              {/each}
            </div>
          {/if}

          <div class="card-footer">
            <span class="card-date">{formatDate(note.created_at)}</span>
            <button
              class="delete-btn"
              on:click|stopPropagation={() => handleDeleteRequest(note.filename)}
              aria-label="ノートを削除"
              title="削除"
            >
              ✕
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Delete Confirmation Dialog -->
{#if showDeleteDialog}
  <div class="dialog-overlay" role="dialog" aria-modal="true" aria-label="削除確認">
    <div class="dialog-box">
      <h2>ノートを削除しますか？</h2>
      {#if deleteTargetPreview}
        <p class="dialog-preview">{deleteTargetPreview.slice(0, 80)}{deleteTargetPreview.length > 80 ? '…' : ''}</p>
      {/if}
      <div class="dialog-actions">
        <button class="btn-cancel" on:click={cancelDelete}>キャンセル</button>
        <button class="btn-delete" on:click={confirmDelete}>削除</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .grid-page {
    padding: 16px;
    min-height: 100vh;
    background: #f8f8f8;
  }

  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
    align-items: center;
  }

  .search-bar input {
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 14px;
    width: 220px;
  }

  .date-filter {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .date-filter label {
    display: flex;
    flex-direction: column;
    font-size: 12px;
    color: #555;
    gap: 2px;
  }

  .date-filter input[type='date'] {
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 13px;
  }

  .reset-date-btn {
    padding: 4px 10px;
    border: 1px solid #bbb;
    border-radius: 4px;
    background: #fff;
    font-size: 12px;
    cursor: pointer;
    align-self: flex-end;
  }

  .reset-date-btn:hover {
    background: #eee;
  }

  .tag-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag-chip {
    padding: 3px 10px;
    border: 1px solid #bbb;
    border-radius: 12px;
    background: #fff;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .tag-chip.active {
    background: #2196f3;
    border-color: #1565c0;
    color: #fff;
  }

  .tag-chip.small {
    font-size: 11px;
    padding: 2px 8px;
  }

  /* Loading */
  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #555;
    margin: 24px auto;
    justify-content: center;
    font-size: 14px;
  }

  .spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid #ccc;
    border-top-color: #2196f3;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Error */
  .error-message {
    color: #c62828;
    background: #ffebee;
    border: 1px solid #ef9a9a;
    border-radius: 6px;
    padding: 12px 16px;
    margin: 16px 0;
    font-size: 14px;
  }

  /* Empty */
  .empty-state {
    text-align: center;
    color: #777;
    margin: 64px auto;
    font-size: 15px;
    max-width: 360px;
  }

  /* Masonry */
  .masonry-grid {
    columns: 3;
    column-gap: 16px;
  }

  @media (max-width: 900px) {
    .masonry-grid { columns: 2; }
  }

  @media (max-width: 600px) {
    .masonry-grid { columns: 1; }
  }

  /* Note Card */
  .note-card {
    break-inside: avoid;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 16px;
    cursor: pointer;
    transition: box-shadow 0.15s;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .note-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .card-body-preview {
    font-size: 13px;
    line-height: 1.6;
    color: #333;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
  }

  .card-date {
    font-size: 11px;
    color: #999;
  }

  .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #bbb;
    font-size: 14px;
    padding: 2px 6px;
    border-radius: 4px;
    line-height: 1;
    transition: color 0.15s, background 0.15s;
  }

  .delete-btn:hover {
    color: #c62828;
    background: #ffebee;
  }

  /* Delete dialog */
  .dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog-box {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    width: 360px;
    max-width: 90vw;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .dialog-box h2 {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
  }

  .dialog-preview {
    font-size: 13px;
    color: #555;
    background: #f5f5f5;
    border-radius: 4px;
    padding: 8px 10px;
    margin: 0 0 16px;
    word-break: break-word;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .btn-cancel {
    padding: 7px 16px;
    border: 1px solid #bbb;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 14px;
  }

  .btn-cancel:hover {
    background: #f0f0f0;
  }

  .btn-delete {
    padding: 7px 16px;
    border: none;
    border-radius: 4px;
    background: #c62828;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
  }

  .btn-delete:hover {
    background: #b71c1c;
  }
</style>
