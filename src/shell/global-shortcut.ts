import { listen } from "@tauri-apps/api/event";

export async function setupGlobalShortcut(onNewNote: () => void): Promise<void> {
  try {
    await listen<void>("new-note", () => {
      onNewNote();
    });
  } catch (err) {
    console.warn("Failed to subscribe new-note event:", err);
  }
}
