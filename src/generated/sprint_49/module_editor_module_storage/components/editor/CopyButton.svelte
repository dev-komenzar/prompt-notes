<script lang="ts">
  export let getContent: () => string;

  let copied = false;
  let errorFlash = false;

  async function handleCopy() {
    try {
      const text = getContent();
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 1500);
    } catch {
      errorFlash = true;
      setTimeout(() => {
        errorFlash = false;
      }, 500);
    }
  }
</script>

<style>
  .copy-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    background: #3182ce;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    z-index: 100;
  }
  .copy-btn:hover {
    background: #2b6cb0;
  }
  .copy-btn:active {
    transform: scale(0.97);
  }
  .copy-btn.copied {
    background: #38a169;
  }
  .copy-btn.error {
    background: #e53e3e;
  }
</style>

<button
  class="copy-btn"
  class:copied
  class:error={errorFlash}
  on:click={handleCopy}
  data-testid="copy-button"
  aria-label="本文をクリップボードにコピー"
>
  {#if copied}
    ✓ コピー済み
  {:else}
    📋 コピー
  {/if}
</button>
