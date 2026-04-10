<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import type { NoteMetadata } from '$lib/types/note';
  import type { SearchParams } from '$lib/types/search';

  export let note: NoteMetadata | null = null;
  export let open: boolean = false;
  export let currentFilter: SearchParams = {};

  const dispatch = createEventDispatcher<{
    deleted: { notes: NoteMetadata[] };
    cancel: void;
  }>();

  let deleting = false;
  let errorMsg: string | null = null;

  const PREVIEW_MAX = 100;

  $: previewText = note
    ? note.body_preview.length > PREVIEW_MAX
      ? note.body_preview.slice(0, PREVIEW_MAX) + '…'
      : note.body_preview
    : '';

  async function handleConfirm() {
    if (!note) return;
    deleting = true;
    errorMsg = null;
    try {
      await invoke<{ success: boolean }>('delete_note', { filename: note.filename });
      const updated = await invoke<{ notes: NoteMetadata[] }>('search_notes', {
        query: currentFilter.query ?? null,
        tags: currentFilter.tags && currentFilter.tags.length > 0 ? currentFilter.tags : null,
        date_from: currentFilter.date_from ?? null,
        date_to: currentFilter.date_to ?? null,
      });
      open = false;
      dispatch('deleted', { notes: updated.notes });
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    } finally {
      deleting = false;
    }
  }

  function handleCancel() {
    open = false;
    dispatch('cancel');
  }

  function handleBackdropClick() {
    if (!deleting) handleCancel();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !deleting) handleCancel();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open && note}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="backdrop"
    on:click={handleBackdropClick}
    role="presentation"
  >
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="dialog"
      on:click|stopPropagation
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <h2 id="delete-dialog-title">ノートを削除しますか？</h2>

      {#if previewText}
        <div class="preview" aria-label="削除対象のノートプレビュー">
          {previewText}
        </div>
      {/if}

      {#if errorMsg}
        <p class="error" role="alert">{errorMsg}</p>
      {/if}

      <div class="actions">
        <button
          class="btn-cancel"
          on:click={handleCancel}
          disabled={deleting}
        >
          キャンセル
        </button>
        <button
          class="btn-delete"
          on:click={handleConfirm}
          disabled={deleting}
        >
          {deleting ? '削除中…' : '削除'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .dialog {
    background: #ffffff;
    border-radius: 8px;
    padding: 24px;
    width: 90%;
    max-width: 440px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  h2 {
    margin: 0 0 14px;
    font-size: 1.05rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  .preview {
    background: #f4f4f5;
    border-left: 3px solid #d4d4d8;
    border-radius: 4px;
    padding: 10px 12px;
    font-size: 0.85rem;
    color: #52525b;
    white-space: pre-wrap;
    word-break: break-word;
    margin-bottom: 16px;
    max-height: 100px;
    overflow: hidden;
  }

  .error {
    color: #dc2626;
    font-size: 0.85rem;
    margin: 0 0 14px;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .btn-cancel,
  .btn-delete {
    padding: 8px 18px;
    border-radius: 5px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
  }

  .btn-cancel {
    border: 1px solid #d4d4d8;
    background: #ffffff;
    color: #3f3f46;
  }

  .btn-cancel:hover:not(:disabled) {
    background: #f4f4f5;
  }

  .btn-delete {
    border: none;
    background: #dc2626;
    color: #ffffff;
    font-weight: 600;
  }

  .btn-delete:hover:not(:disabled) {
    background: #b91c1c;
  }

  .btn-cancel:disabled,
  .btn-delete:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
</style>
