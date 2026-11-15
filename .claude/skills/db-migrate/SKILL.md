---
name: db-migrate
description: Apply Supabase database migrations safely. Runs staging first, then the RLS check, then a backed-up production push. Use for any change under supabase/migrations/.
disable-model-invocation: true
---

# Apply Supabase migrations (staging, then production)

The user may not be comfortable with database work. Explain each step in one
plain sentence as you go (what it does and why), and never skip a gate below.

## Projects

| Role       | Name                  | Ref                    |
| ---------- | --------------------- | ---------------------- |
| Staging    | recipe-vault-staging  | `stdquppwaqvsxbdrtxne` |
| Production | (the default project) | `izogogrmawhnildegyug` |

Supabase labels the output of BOTH projects as `environment: production`.
Ignore that label. The project ref in the `Target:` line is the only reliable
check. Before every remote command, confirm the ref is the one you intend.

## CLI rules (learned the hard way)

- Always pass `--remote`. Without it the CLI targets the local Docker stack and
  fails with a confusing `ECONNREFUSED 127.0.0.1:54322`.
- In agent mode, a real push needs `--yes`. Only add it after showing the user
  the dry-run output and getting their go-ahead for that specific project.
- `supabase link` changes local state (`supabase/.temp/project-ref`). Note which
  project was linked at the start and restore it at the end.
- `supabase db dump` is schema-only by default. A real backup also needs
  `--data-only`.

## Before you start

1. Read the new migration file(s) and summarize in plain language what they
   change. Flag anything destructive (`DROP`, `DELETE`, `NOT NULL` on an
   existing column without a default, policy changes).
2. If it adds a table, check RLS is enabled and policies exist. If it adds or
   changes a column, check `src/types.ts`, `src/lib/supabase/types.ts` and
   `src/lib/supabase/transforms.ts` are updated (or say they need to be).
3. Run `npm test` and `npm run lint`. Stop if either fails.
4. Note the currently linked project (`cat supabase/.temp/project-ref`).

## Step 1: Staging

1. Check staging is not paused: `supabase projects list -o json` and read its
   `status`. If `INACTIVE`, stop and ask the user to click Restore in the
   dashboard. Do not try to restore it yourself.
2. `supabase link --project-ref stdquppwaqvsxbdrtxne`
3. `supabase db push --remote --dry-run`. Confirm the pending list is exactly
   the migrations you expect, and the `Target:` ref is the staging ref.
4. Show the user the list. After their OK: `supabase db push --remote --yes`
5. `RLS_TEST_REF=stdquppwaqvsxbdrtxne npm run test:rls`. Every line must PASS.
   If anything FAILs, stop and investigate. Do not continue to production.
   (If the RLS check ran before the push completed, its results are
   meaningless. Re-run it after the migration is actually applied.)
6. If the migration changes behavior (a trigger, a sort, a policy), add a check
   for it to `supabase/tests/rls.check.mjs` and re-run.

## GATE: ask the user before production

Summarize what passed on staging and ask explicitly whether to continue to
production. Never proceed on a previous approval for staging.

## Step 2: Production

1. `supabase link --project-ref izogogrmawhnildegyug`, then confirm
   `cat supabase/.temp/project-ref` prints the production ref.
2. Back up outside the repo (the files contain real user data):
   ```
   mkdir -p ~/supabase-backups && chmod 700 ~/supabase-backups
   supabase db dump --remote -f ~/supabase-backups/backup-<change>-<date>.sql
   supabase db dump --remote --data-only -f ~/supabase-backups/backup-<change>-<date>-data.sql
   chmod 600 ~/supabase-backups/*.sql
   ```
   The data dump warns about `--disable-triggers` on restore. That is expected.
   The free plan has no automatic backups, so this is the only safety net.
3. `supabase db push --remote --dry-run`. Confirm only the expected migrations
   are pending and the `Target:` ref is production.
4. After the user's OK: `supabase db push --remote --yes`
5. Verify: a second `supabase db push --remote --dry-run` should report
   `"upToDate":true`.
6. Do NOT run `npm run test:rls` against production. It refuses on purpose.

## After

- Restore the originally linked project (`supabase link --project-ref <ref>`).
- Order matters: if app code reads a new column or table, the migration must
  be live BEFORE the code deploys. If the migration removes something the old
  code reads, deploy the code first. State which applies to this change.
- Remind the user where the backups are and that they can delete them once the
  change is confirmed stable.
- Remind the user to regenerate `src/lib/supabase/types.ts`
  (`supabase gen types typescript --linked`) if it was edited by hand, and to
  check the diff is only formatting.

## Never

- Never push to production without a green staging run and an explicit go-ahead.
- Never edit the schema in the Supabase dashboard. Use migration files.
- Never remove the production guard in `supabase/tests/rls.check.mjs`.
- Never commit backup files or put them inside the repo.
