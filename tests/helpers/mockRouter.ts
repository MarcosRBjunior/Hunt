import { vi } from "vitest";

/**
 * Router do App Router usado nos testes de componente (o jsdom não monta o
 * App Router). `tests/setup/dom.ts` liga este objeto ao `useRouter`.
 */
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};
