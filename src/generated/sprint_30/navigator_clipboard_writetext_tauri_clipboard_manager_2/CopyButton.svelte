<script lang="ts">
  import type { EditorView } from '@codemirror/view';

  export let editorView: EditorView;

  let copied = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function extractBody(doc: string): string {
    const match = doc.match(/^---\n[\s\S]*?\n---\n/);
    return match ? doc.slice(match[0].length) : doc;
  }

  async function handleCopy() {
    const fullText = editorView.state.doc.toString();
    const body = extractBody(fullText);
    await navigator.clipboard.writeText(body);
    copied = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<button class="copy-button" class:copied on:click={handleCopy} aria-label="本文をコピー">
  {copied ? '✓ コピー済み' : 'コピー'}
</button>

<style>
  .copy-button {
    position: fixed;
    top: 12px;
    right: 16px;
    z-index: 100;
    padding: 6px 14px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #ffffff;
    color: #374151;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.4;
    transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    user-select: none;
  }

  .copy-button:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  .copy-button.copied {
    background: #ecfdf5;
    border-color: #6ee7b7;
    color: #065f46;
  }
</style>
