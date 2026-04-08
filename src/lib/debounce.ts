// Sprint 4/16 – Debounce utility with flush/cancel/pending

export interface DebouncedFn<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  /** Immediately invoke the pending call, if any */
  flush(): void;
  /** Cancel the pending call */
  cancel(): void;
  /** Whether a call is currently pending */
  pending(): boolean;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): DebouncedFn<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    latestArgs = args;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      const a = latestArgs;
      latestArgs = null;
      if (a !== null) {
        fn(...a);
      }
    }, delayMs);
  };

  debounced.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (latestArgs !== null) {
      const a = latestArgs;
      latestArgs = null;
      fn(...a);
    }
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    latestArgs = null;
  };

  debounced.pending = () => timeoutId !== null;

  return debounced as DebouncedFn<T>;
}
