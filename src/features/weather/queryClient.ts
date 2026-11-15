import { QueryClient } from '@tanstack/react-query';

// The app's only TanStack Query client: it holds the weather only (SPEC
// §11.2), in memory for now; offline persistence comes with Today (S7).
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});
