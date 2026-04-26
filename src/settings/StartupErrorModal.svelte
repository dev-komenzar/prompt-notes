<script lang="ts">
  interface Props {
    message: string;
    onClose: () => void;
  }

  let { message, onClose }: Props = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="modal-overlay" data-testid="startup-error-modal" on:click|self={onClose}>
  <div class="modal" role="alertdialog" aria-label="Startup Error">
    <div class="modal-header">
      <h2>⚠ Startup Error</h2>
      <button class="modal-close" on:click={onClose}>✕</button>
    </div>
    <div class="modal-body">
      <p class="error-message">{message}</p>
      <p class="error-hint">
        Open Settings to configure the notes directory, or check file permissions.
      </p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" on:click={onClose}>OK</button>
    </div>
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .modal {
    background: var(--surface);
    border-radius: var(--radius);
    width: 420px;
    max-width: 90vw;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }

  .modal-header h2 {
    font-size: 16px;
    font-weight: 600;
    color: var(--danger);
  }

  .modal-close {
    font-size: 16px;
    color: var(--text-secondary);
    padding: 4px;
  }

  .modal-body {
    padding: 20px;
  }

  .error-message {
    font-size: 14px;
    margin-bottom: 12px;
    font-family: var(--font-mono);
    background: var(--surface-hover);
    padding: 8px 12px;
    border-radius: 4px;
    word-break: break-all;
  }

  .error-hint {
    font-size: 13px;
    color: var(--text-secondary);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px 20px;
    border-top: 1px solid var(--border);
  }

  .btn-primary {
    padding: 6px 20px;
    border-radius: var(--radius);
    font-size: 13px;
    background: var(--accent);
    color: #fff;
  }

  .btn-primary:hover {
    background: var(--accent-hover);
  }
</style>
