<script lang="ts">
  export let getContent: () => string;

  let copied = false;
  let errorFlash = false;

  async function handleCopy() {
    try {
      const text = getContent();
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => { copied = false; }, 1500);
    } catch {
      errorFlash = true;
      setTimeout(() => { errorFlash = false; }, 500);
    }
  }
</script>

<button
  class="copy-btn"
  class:error={errorFlash}
  on:click={handleCopy}
  aria-label={copied ? 'コピー済み' : '本文をコピー'}
  title={copied ? 'コピー済み' : '本文をコピー'}
>
  {#if copied}
    <span class="icon" aria-hidden="true">✓</span>
  {:else}
    <span class="icon" aria-hidden="true">📋</span>
  {/if}
</button>

<style>
  .copy-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 1px solid var(--border-color, #d1d5db);
    background: var(--btn-bg, #ffffff);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    transition: background 0.15s ease, border-color 0.15s ease;
    z-index: 10;
  }

  .copy-btn:hover {
    background: var(--btn-hover-bg, #f3f4f6);
  }

  .copy-btn.error {
    animation: flash-red 0.5s ease forwards;
  }

  @keyframes flash-red {
    0%   { background: #ef4444; border-color: #ef4444; }
    100% { background: #fee2e2; border-color: #fca5a5; }
  }

  .icon {
    line-height: 1;
    user-select: none;
  }
</style>
