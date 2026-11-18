/* eslint-disable @typescript-eslint/no-explicit-any */

export interface QueryResult {
  data?: any;
  error?: { message: string } | null;
}

const CHAIN_METHODS = [
  'select',
  'insert',
  'update',
  'upsert',
  'delete',
  'eq',
  'in',
] as const;

/**
 * A chainable stand-in for a Supabase query builder. Every chain method returns
 * the builder, and awaiting it (or calling single/maybeSingle) resolves to
 * `result`.
 */
export function createQueryBuilder(result: QueryResult) {
  const resolved = { data: null, error: null, ...result };
  const builder: Record<string, any> = {};
  CHAIN_METHODS.forEach((method) => {
    builder[method] = jest.fn(() => builder);
  });
  builder.single = jest.fn(() => Promise.resolve(resolved));
  builder.maybeSingle = jest.fn(() => Promise.resolve(resolved));
  builder.then = (resolve: any, reject: any) =>
    Promise.resolve(resolved).then(resolve, reject);
  return builder;
}

/**
 * A fake Supabase client. `tables` maps a table name to the results that
 * successive `from(table)` calls resolve to (the last one repeats). Each
 * builder handed out is recorded in `builders[table]` for assertions.
 */
export function createSupabaseMock({
  user = null,
  tables = {},
  storage,
}: {
  user?: { id: string; app_metadata?: Record<string, unknown> } | null;
  tables?: Record<string, QueryResult[]>;
  storage?: Record<string, any>;
} = {}) {
  const builders: Record<string, ReturnType<typeof createQueryBuilder>[]> = {};
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
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
    storage: storage ?? { from: jest.fn() },
  };
}
