import { writable } from "svelte/store";
import { isTauriCommandError } from "./tauri-commands";

export interface AppError {
  id: number;
  message: string;
  code?: string;
  timestamp: number;
}

let errorId = 0;

export const errors = writable<AppError[]>([]);

export function handleCommandError(error: unknown): void {
  let message = "An unexpected error occurred";
  let code: string | undefined;

  if (isTauriCommandError(error)) {
    code = error.code;
    switch (error.code) {
      case "STORAGE_NOT_FOUND":
        message = "Note not found. It may have been deleted.";
        break;
      case "STORAGE_INVALID_FILENAME":
        message = "Invalid filename format.";
        break;
      case "STORAGE_WRITE_FAILED":
        message = "Failed to write note. Check file permissions.";
        break;
      case "STORAGE_READ_FAILED":
        message = "Failed to read note file.";
        break;
      case "STORAGE_PATH_TRAVERSAL":
        message = "Invalid file path detected.";
        break;
      case "STORAGE_FRONTMATTER_PARSE":
        message = "Note has invalid frontmatter format.";
        break;
      case "CONFIG_INVALID_DIR":
        message = "Notes directory is invalid or inaccessible.";
        break;
      case "CONFIG_WRITE_FAILED":
        message = "Failed to save settings.";
        break;
      case "CLIPBOARD_FAILED":
        message = "Clipboard operation failed.";
        break;
      case "TRASH_FAILED":
        message = "Trash is not available on this system.";
        break;
      default:
        message = error.message || "An unexpected error occurred";
    }
    // Log full detail to console for debugging
    console.error(`[${error.code}] ${error.message}`);
  } else if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  }

  const appError: AppError = {
    id: ++errorId,
    message,
    code,
    timestamp: Date.now(),
  };
  errors.update((list) => [...list, appError]);
  setTimeout(() => {
    errors.update((list) => list.filter((e) => e.id !== appError.id));
  }, 5000);
}

export function dismissError(id: number): void {
  errors.update((list) => list.filter((e) => e.id !== id));
}
