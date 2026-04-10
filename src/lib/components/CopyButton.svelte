<script lang="ts">
  import { copyToClipboard } from '../utils/clipboard';
  import { extractBody } from '../utils/frontmatter';

  interface Props {
    getRawContent: () => string;
  }

  let { getRawContent }: Props = $props();
  let copied = $state(false);

  async function handleCopy() {
    const raw = getRawContent();
    const body = extractBody(raw);
    const ok = await copyToClipboard(body);
    if (ok) {
      copied = true;
      setTimeout(() => (copied = false), 1500);
    }
  }
</script>

<button class="copy-button" onclick={handleCopy} title="本文をコピー" type="button">
  {copied ? '✓ コピー済み' : '📋 コピー'}
</button>

<style>
  .copy-button {
    padding: 6px 14px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    color: var(--color-primary);
    background: rgba(137, 180, 250, 0.1);
    transition: all var(--transition-fast);
    white-space: nowrap;
  }

  .copy-button:hover {
    background: rgba(137, 180, 250, 0.2);
  }
</style>
