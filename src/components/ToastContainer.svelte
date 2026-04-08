<!-- Sprint 22/70 – Toast notification container (OQ-006 resolution) -->
<script lang="ts">
  import { toasts, dismissToast } from "../lib/stores";
  import { fly, fade } from "svelte/transition";
</script>

<div class="toast-container" aria-live="polite">
  {#each $toasts as toast (toast.id)}
    <div
      class="toast toast-{toast.level}"
      role="alert"
      in:fly={{ y: 50, duration: 250 }}
      out:fade={{ duration: 200 }}
    >
      <div class="toast-icon">
        {#if toast.level === "success"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        {:else if toast.level === "error"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        {:else if toast.level === "warning"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        {/if}
      </div>
      <span class="toast-message">{toast.message}</span>
      <button
        class="toast-dismiss"
        on:click={() => dismissToast(toast.id)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 16px;
    right: 16px;
    display: flex;
    flex-direction: column-reverse;
    gap: 8px;
    z-index: 9999;
    pointer-events: none;
    max-width: 400px;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    pointer-events: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
  }

  .toast-info {
    border-left: 3px solid var(--info-color);
  }

  .toast-success {
    border-left: 3px solid var(--success-color);
  }

  .toast-warning {
    border-left: 3px solid var(--warning-color);
  }

  .toast-error {
    border-left: 3px solid var(--error-color);
  }

  .toast-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .toast-info .toast-icon { color: var(--info-color); }
  .toast-success .toast-icon { color: var(--success-color); }
  .toast-warning .toast-icon { color: var(--warning-color); }
  .toast-error .toast-icon { color: var(--error-color); }

  .toast-message {
    flex: 1;
    color: var(--text-primary);
    line-height: 1.4;
  }

  .toast-dismiss {
    flex-shrink: 0;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 18px;
    cursor: pointer;
    padding: 0 2px;
    line-height: 1;
  }

  .toast-dismiss:hover {
    color: var(--text-primary);
  }
</style>
