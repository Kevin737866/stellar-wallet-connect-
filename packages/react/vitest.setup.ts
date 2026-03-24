import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom/vitest';

// Extends Vitest's expect with methods like toHaveTextContent
expect.extend(matchers);

// Run cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});