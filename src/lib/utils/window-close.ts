import { getCurrentWindow } from "@tauri-apps/api/window";

let pendingSaveFn: (() => Promise<void>) | null = null;

export function registerPendingSave(fn: () => Promise<void>): void {
  pendingSaveFn = fn;
}

export function clearPendingSave(): void {
  pendingSaveFn = null;
}

export function setupWindowCloseHandler(): void {
  const appWindow = getCurrentWindow();
  appWindow.onCloseRequested(async (event) => {
    if (pendingSaveFn) {
      event.preventDefault();
      try {
        await pendingSaveFn();
      } catch {
        // Best-effort save; proceed with close
      }
      pendingSaveFn = null;
      await appWindow.close();
    }
  });
}
