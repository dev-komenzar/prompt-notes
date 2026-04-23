<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";

  interface Props {
    errorMessage: string;
    onUseDirect: () => void;
    onPickDir: () => void;
  }

  let { errorMessage, onUseDirect, onPickDir }: Props = $props();

  async function handleQuit() {
    await getCurrentWindow().close();
  }
</script>

<div class="startup-error-overlay" role="alertdialog" aria-modal="true" aria-label="起動エラー">
  <div class="startup-error-box">
    <h2>起動エラー</h2>
    <p class="error-detail">{errorMessage}</p>
    <div class="startup-error-actions">
      <button onclick={handleQuit}>終了する</button>
      <button onclick={onPickDir}>別のディレクトリを選ぶ</button>
      <button class="primary" onclick={onUseDirect}>そのまま使う</button>
    </div>
  </div>
</div>

<style>
  .startup-error-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }
  .startup-error-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 32px;
    max-width: 480px;
    width: 90%;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  h2 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--danger, #dc2626);
  }
  .error-detail {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--text-secondary, var(--text));
    word-break: break-word;
  }
  .startup-error-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .startup-error-actions button {
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
  }
  .startup-error-actions .primary {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }
</style>
