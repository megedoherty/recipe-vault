export interface QueryResult {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
}

const CHAIN_METHODS = [
  'select',
  'insert',
  'update',
  'upsert',
  'delete',
  'eq',
  'in',
  'not',
  'ilike',
  'gte',
  'lte',
  'order',
  'limit',
  'range',
  'overrideTypes',
] as const;

/** Every method on the fake builder is a jest.fn, including the `then` that makes it awaitable. */
export type QueryBuilder = Record<string, jest.Mock>;

/**
 * A chainable stand-in for a Supabase query builder. Every chain method returns
 * the builder, and awaiting it (or calling single/maybeSingle) resolves to
 * `result`.
 */
export function createQueryBuilder(result: QueryResult): QueryBuilder {
  const resolved = { data: null, error: null, ...result };
  const builder: QueryBuilder = {};
  CHAIN_METHODS.forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  builder.single = jest.fn(() => Promise.resolve(resolved));
  builder.maybeSingle = jest.fn(() => Promise.resolve(resolved));
  builder.then = jest.fn(
    (
      resolve?: (value: QueryResult) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolved).then(resolve, reject),
  );
  return builder;
}

/**
 * A fake Supabase client. `tables` maps a table name to the results that
 * successive `from(table)` calls resolve to (the last one repeats). Each
 * builder handed out is recorded in `builders[table]` for assertions.
 */
export function createSupabaseMock({
  user = null,
  claims = user ? { sub: user.id } : null,
  tables = {},
  storage,
}: {
  user?: { id: string; app_metadata?: Record<string, unknown> } | null;
  /** What `auth.getClaims()` resolves to; defaults to the user's id as `sub`. */
  claims?: { sub: string } | null;
  tables?: Record<string, QueryResult[]>;
  storage?: Record<string, unknown>;
} = {}) {
  const builders: Record<string, QueryBuilder[]> = {};
  const calls: Record<string, number> = {};

  const from = jest.fn((table: string) => {
    const queue = tables[table] ?? [{}];
    const index = Math.min(calls[table] ?? 0, queue.length - 1);
    calls[table] = (calls[table] ?? 0) + 1;
    const builder = createQueryBuilder(queue[index]);
    (builders[table] ??= []).push(builder);
    return builder;
  });

  return {
    from,
    builders,
    auth: {
      getClaims: jest.fn().mockResolvedValue({ data: { claims } }),
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
    storage: storage ?? { from: jest.fn() },
  };
}
