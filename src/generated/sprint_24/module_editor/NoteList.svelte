<script lang="ts">
  // @generated-from: docs/detailed_design/editor_clipboard_design.md
  // Sprint 24 — NoteList.svelte: 左サイドバー（240px固定幅）、ノート一覧表示、選択状態管理、削除操作
  import { onMount, createEventDispatcher } from 'svelte';
  import type { NoteMetadata } from '../../../lib/types';
  import { listNotes, deleteNote } from '../../../lib/ipc';
  import { notesStore } from '../../../stores/notes';

  /** 現在エディタで開いているノートの id。親から渡される。 */
  export let selectedId: string | null = null;

  const dispatch = createEventDispatcher<{
    select: NoteMetadata;
    /** 削除完了後に親へ通知。selectedId と一致する場合はエディタをクリアする。 */
    delete: { id: string };
  }>();

  let loadError: string | null = null;
  let deleteError: string | null = null;
  let deletingId: string | null = null;

  onMount(async () => {
    await refresh();
  });

  /**
   * ノート一覧を Rust バックエンドから再取得して notesStore を更新する。
   * EditorView から Cmd+N 後に呼び出されることを想定して export する。
   */
  export async function refresh(): Promise<void> {
    loadError = null;
    try {
      const notes = await listNotes();
      // created_at 降順（新しい順）
      notes.sort((a, b) => b.created_at.localeCompare(a.created_at));
      notesStore.set(notes);
    } catch {
      loadError = '読み込み失敗';
    }
  }

  function handleSelect(note: NoteMetadata) {
    dispatch('select', note);
  }

  async function handleDelete(e: MouseEvent | KeyboardEvent, id: string) {
    e.stopPropagation();
    if (deletingId !== null) return;
    deletingId = id;
    deleteError = null;
    try {
      await deleteNote(id);
      notesStore.update(ns => ns.filter(n => n.id !== id));
      dispatch('delete', { id });
    } catch {
      deleteError = '削除に失敗しました';
      setTimeout(() => { deleteError = null; }, 3000);
    } finally {
      deletingId = null;
    }
  }

  function formatDate(createdAt: string): string {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return createdAt;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${day}`;
  }
</script>

<aside class="note-list" aria-label="ノート一覧">
  {#if loadError}
    <p class="msg error">{loadError}</p>
  {/if}
  {#if deleteError}
    <p class="msg error">{deleteError}</p>
  {/if}

  {#each $notesStore as note (note.id)}
    <div
      class="note-item"
      class:selected={note.id === selectedId}
      role="button"
      tabindex="0"
      aria-pressed={note.id === selectedId}
      on:click={() => handleSelect(note)}
      on:keydown={(e) => e.key === 'Enter' && handleSelect(note)}
    >
      <div class="note-header">
        <time class="note-date" datetime={note.created_at}>
          {formatDate(note.created_at)}
        </time>
        <button
          class="delete-btn"
          aria-label="ノートを削除"
          title="削除"
          disabled={deletingId === note.id}
          on:click={(e) => handleDelete(e, note.id)}
          on:keydown={(e) => e.key === 'Enter' && handleDelete(e, note.id)}
        >
          {deletingId === note.id ? '…' : '×'}
        </button>
      </div>

      {#if note.tags && note.tags.length > 0}
        <div class="note-tags" aria-label="タグ">
          {#each note.tags as tag}
            <span class="tag">{tag}</span>
          {/each}
        </div>
      {/if}

      {#if note.preview}
        <p class="note-preview">{note.preview}</p>
      {/if}
    </div>
  {:else}
    {#if !loadError}
      <p class="msg empty">ノートがありません</p>
    {/if}
  {/each}
</aside>

<style>
  /* ── サイドバー本体: 240px 固定幅 ── */
  .note-list {
    width: 240px;
    min-width: 240px;
    max-width: 240px;
    height: 100%;
    overflow-y: auto;
    border-right: 1px solid var(--border-color, #e2e8f0);
    background: var(--sidebar-bg, #f8fafc);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }

  /* ── ノートカード ── */
  .note-item {
    padding: 10px 12px;
    cursor: pointer;
    border-bottom: 1px solid var(--border-color, #e2e8f0);
    border-left: 3px solid transparent;
    outline: none;
    transition: background 0.1s ease;
    user-select: none;
  }

  .note-item:hover {
    background: var(--item-hover-bg, #edf2f7);
  }

  .note-item:focus-visible {
    box-shadow: inset 0 0 0 2px var(--accent-color, #4a90e2);
  }

  .note-item.selected {
    background: var(--item-selected-bg, #e2e8f0);
    border-left-color: var(--accent-color, #4a90e2);
  }

  /* ── ヘッダー行（日付 + 削除ボタン）── */
  .note-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    gap: 4px;
  }

  .note-date {
    font-size: 11px;
    color: var(--text-muted, #718096);
    white-space: nowrap;
  }

  .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-muted, #a0aec0);
    font-size: 13px;
    padding: 1px 4px;
    border-radius: 3px;
    line-height: 1;
    opacity: 0;
    transition: opacity 0.12s ease, color 0.12s ease, background 0.12s ease;
    flex-shrink: 0;
  }

  .note-item:hover .delete-btn,
  .note-item.selected .delete-btn,
  .note-item:focus-within .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover:not(:disabled) {
    color: var(--danger-color, #e53e3e);
    background: var(--danger-bg, #fff5f5);
  }

  .delete-btn:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  /* ── タグ一覧 ── */
  .note-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    margin-bottom: 4px;
  }

  .tag {
    font-size: 10px;
    padding: 1px 6px;
    background: var(--tag-bg, #e2e8f0);
    color: var(--tag-color, #4a5568);
    border-radius: 999px;
    white-space: nowrap;
  }

  /* ── 本文プレビュー ── */
  .note-preview {
    font-size: 12px;
    color: var(--text-secondary, #4a5568);
    margin: 0;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    line-height: 1.5;
    word-break: break-word;
  }

  /* ── ユーティリティメッセージ ── */
  .msg {
    margin: 0;
    padding: 10px 12px;
    font-size: 12px;
  }

  .msg.error {
    color: var(--danger-color, #e53e3e);
    background: var(--danger-bg-light, #fff5f5);
  }

  .msg.empty {
    color: var(--text-muted, #718096);
    text-align: center;
    padding: 24px 12px;
  }
</style>
