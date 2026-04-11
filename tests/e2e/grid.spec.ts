import { waitForAppReady, navigateToView, getGridCardCount, clickGridCard, isCodeMirror6Active } from '../helpers/webview-client';
import { createTempNotesDir, cleanupTempDir, seedRecentNotes, seedNote, writeTestConfig } from '../helpers/test-fixtures';

describe('module:grid — E2E Tests', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = createTempNotesDir();
    writeTestConfig(tempDir, tempDir);
  });

  afterEach(async () => {
    cleanupTempDir(tempDir);
  });

  // AC-GR-01: Pinterest-style card display
  it('AC-GR-01: grid displays note cards', async () => {
    seedRecentNotes(tempDir, 5);
    await waitForAppReady();
    await navigateToView('grid');
    await browser.pause(1_000);

    const cardCount = await getGridCardCount();
    expect(cardCount).toBeGreaterThanOrEqual(1);
  });

  // AC-GR-02: Default 7-day filter
  it('AC-GR-02: default filter shows only notes from last 7 days', async () => {
    const recentCount = 3;
    seedRecentNotes(tempDir, recentCount);
    // Seed old notes (14+ days ago)
    const now = new Date();
    const oldDate = new Date(now);
    oldDate.setDate(oldDate.getDate() - 14);
    seedNote(tempDir, oldDate, ['old'], 'Old note');

    await waitForAppReady();
    await navigateToView('grid');
    await browser.pause(1_500);

    const cardCount = await getGridCardCount();
    expect(cardCount).toBe(recentCount);
  });

  // AC-GR-03: Tag filter exists
  it('AC-GR-03: tag filter UI exists', async () => {
    seedRecentNotes(tempDir, 3);
    await waitForAppReady();
    await navigateToView('grid');
    await browser.pause(1_000);

    const tagFilter = await browser.$('[data-testid="tag-filter"], .tag-filter, [aria-label*="tag" i]');
    expect(await tagFilter.isExisting()).toBe(true);
  });

  // AC-GR-04: Date filter exists
  it('AC-GR-04: date filter UI exists', async () => {
    seedRecentNotes(tempDir, 3);
    await waitForAppReady();
    await navigateToView('grid');
    await browser.pause(1_000);

    const dateFilter = await browser.$('[data-testid="date-filter"], .date-filter, [aria-label*="date" i], input[type="date"]');
    expect(await dateFilter.isExisting()).toBe(true);
  });

  // AC-GR-05: Full-text search
  it('AC-GR-05: search input exists', async () => {
    seedRecentNotes(tempDir, 3);
    await waitForAppReady();
    await navigateToView('grid');
    await browser.pause(1_000);

    const searchInput = await browser.$('[data-testid="search-input"], input[type="search"], input[placeholder*="search" i], input[placeholder*="検索"]');
    expect(await searchInput.isExisting()).toBe(true);
  });

  // AC-GR-06: Card click navigates to editor
  it('AC-GR-06: card click navigates to editor', async () => {
    seedRecentNotes(tempDir, 2);
    await waitForAppReady();
    await navigateToView('grid');
    await browser.pause(1_500);

    const cardCount = await getGridCardCount();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    await clickGridCard(0);
    await browser.pause(1_500);

    expect(await isCodeMirror6Active()).toBe(true);
  });
});
