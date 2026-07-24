import { vi } from 'vitest';

/**
 * Global test setup: mock the Supabase SDK for EVERY spec.
 *
 * The Angular Vitest runner executes all specs with `isolate: false` and
 * `fileParallelism: false` (see the @angular/build unit-test executor). With a
 * shared module registry, a service module (TaskService/ContactService) gets
 * bound to whichever `@supabase/supabase-js` implementation was active the first
 * time it was evaluated. A component spec that imports such a service WITHOUT
 * mocking Supabase would therefore bind it to the real SDK and cache that
 * binding for the whole run – so the service specs intermittently hit the real
 * database (flaky, order-dependent failures).
 *
 * Mocking Supabase here – in a global setup file – guarantees the mock is
 * always applied before any spec, so no service ever binds to the real client.
 *
 * The mock resolves the query builder of the currently running test via a
 * factory stored on `globalThis` (see `useSupabaseTestClient`). Specs that need
 * to configure Supabase results register their own builder in `beforeEach`;
 * every other spec transparently gets a builder that resolves empty results and
 * makes no network call.
 */
const supabaseTestClient = vi.hoisted(() => {
  const KEY = '__joinActiveSupabaseClientFactory__';
  const chainableMethods = [
    'from',
    'select',
    'order',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'single',
    'maybeSingle',
  ];

  /** A chainable, thenable builder that resolves to an empty result set. */
  const createFallbackBuilder = (): Record<string, unknown> => {
    const builder: Record<string, unknown> = {};
    for (const method of chainableMethods) {
      builder[method] = () => builder;
    }
    builder['then'] = (resolve: (value: unknown) => unknown) =>
      resolve({ data: null, error: null });
    return builder;
  };

  return {
    KEY,
    resolveClient(): unknown {
      const factory = (globalThis as Record<string, unknown>)[KEY];
      return typeof factory === 'function'
        ? (factory as () => unknown)()
        : createFallbackBuilder();
    },
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => supabaseTestClient.resolveClient(),
}));

/**
 * Registers the Supabase query-builder factory used by the currently running
 * test. Call it in a spec's `beforeEach` so `createClient()` resolves through
 * this spec's own mock, independent of test/spec execution order.
 */
export function useSupabaseTestClient(factory: () => unknown): void {
  (globalThis as Record<string, unknown>)[supabaseTestClient.KEY] = factory;
}
