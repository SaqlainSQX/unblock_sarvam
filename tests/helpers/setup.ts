import { beforeEach, vi } from 'vitest';
beforeEach(() => {
  vi.unstubAllGlobals();
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Offline test attempted unmocked network access'); }));
});
