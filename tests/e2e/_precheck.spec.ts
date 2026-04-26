/**
 * Precheck suite — runs before every other E2E spec.
 *
 * If the Tauri release binary still tries to load `http://localhost:1420`
 * (devUrl fallback), WebKitGTK shows a "Could not connect to localhost:
 * Connection refused" page and every subsequent feature spec fails with
 * cryptic DOM errors. This suite detects that page and fails fast.
 *
 * Combined with `bail: 1` in `tests/wdio.conf.ts`, a precheck failure cancels
 * the rest of the run so the user fixes the production build, not the test
 * surface.
 */

describe('precheck — Tauri binary sanity', () => {
  it('loads bundled frontend (not devUrl fallback)', async () => {
    // Intentionally do not call `waitForAppReady`: when the binary is broken,
    // `#app` never mounts and we want the failure message to come from this
    // suite, not from a generic 15s timeout in the helper.
    await browser.pause(800);

    const bodyText = (await browser.execute(
      () => document.body?.innerText ?? '',
    )) as string;

    const devFallback =
      /Could not connect to localhost/i.test(bodyText) ||
      /Connection refused/i.test(bodyText) ||
      /ERR_CONNECTION_REFUSED/i.test(bodyText);

    if (devFallback) {
      const msg =
        '\n\n[E2E PRECHECK FAIL] Tauri binary is loading from devUrl ' +
        '(http://localhost:1420), not the bundled frontend. The production ' +
        'asset embed is broken.\n\n' +
        'To fix:\n' +
        '  pnpm tauri build --no-bundle    # canonical production build path\n\n' +
        `Body observed: ${JSON.stringify(bodyText.slice(0, 200))}\n`;
      // eslint-disable-next-line no-console
      console.error(msg);
      // Catastrophic — every other spec would cascade-fail with the same
      // root cause. Hard-stop the runner so the user sees ONE clear error.
      process.exit(1);
    }

    const appExists = (await browser.execute(() =>
      Boolean(document.querySelector('#app, [data-testid="app-root"]')),
    )) as boolean;
    expect(appExists).toBe(true);
  });
});
