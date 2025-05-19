import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Mock global objects that might not be available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Clean up after each test
afterEach(() => {
  cleanup();
});