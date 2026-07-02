# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # Lint JS/TS (eslint) + CSS (stylelint)
npm run lint:fix     # Auto-fix both
npm test             # Run Jest test suite
npx jest path/to/File.test.tsx   # Run a single test file
npx jest -t "name of test"        # Run tests matching a name
```

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Stack

Next.js 16 (App Router) + React 19, TypeScript (strict), Supabase (Postgres + Auth) via `@supabase/ssr`, CSS Modules (no CSS framework). Path alias `@/*` → `src/*`. Tests use Jest + React Testing Library (jsdom).

## Architecture

The app is a personal recipe manager: users import recipes from URLs, edit them, search/filter their collection, and build shopping lists.

### Layered data flow (important)

Data access is split into three layers — respect this separation:

1. **`src/lib/supabase/queries/*`** — Raw Supabase reads. Each function creates its own server client and returns a `*Db` shape (snake_case, matching the DB), then hands off to a transform. Never call the Supabase client directly from components.
2. **`src/lib/supabase/transforms.ts`** — Converts `*Db` shapes → camelCase FE types. This is where JSON columns (`instructions`, `storage`, `instruction_section_order`) are validated with type guards and where section ordering is applied via `sortByOrder`.
3. **`src/lib/actions/*`** — `'use server'` Server Actions for mutations (create/update/delete recipes, categories, image upload) and the URL recipe parser. Actions handle cleanup logic (e.g. stripping empty instruction steps, reconciling deleted ingredient IDs) before writing.

`src/types.ts` is the single source of FE types. It deliberately pairs each DB shape (`RecipeDisplayDb`, `EditableRecipeDb`, …) with its FE counterpart (`RecipeDisplay`, `EditableRecipe`, …). When adding a field, update both the query `select`, the `*Db` type, the FE type, and the transform.

### Recipe parsing

`src/lib/actions/recipeParser/` scrapes a recipe from an arbitrary URL. `recipeParser.ts` orchestrates: fetch HTML → `cheerio` → prefer JSON-LD structured data (`getRecipeFromJsonLd`), then fall back to / augment with HTML heuristics for ingredients, instructions, images, servings, category, meal type, and notes. Ingredients are always re-parsed from HTML because the Recipe schema can't express ingredient sections. Parsed ingredient/instruction text is normalized in `src/lib/utils/parse.ts` and `regex.ts`.

### Auth

Supabase auth clients are created per-request/per-call (never cached in a global — see comments in `server.ts`/`proxy.ts`, this matters for Fluid compute). `src/lib/supabase/proxy.ts` `updateSession` holds the redirect-to-login logic for unauthenticated users. `getAllRecipes` scopes to the current user's `user_id` by default unless `includeAllUsers` is passed.

### UI structure

Components follow atomic design under `src/components/`: `atoms/` (Button, Input, icons…), `molecules/` (Dialog, RecipeCard, editors…), `organisms/` (RecipeForm, section editors). Route-specific components live alongside their route in `src/app/**/components/`. Each component is a folder with `Component.tsx`, `Component.module.css`, and colocated `Component.test.tsx`.

Search/filter state on the home page is driven entirely by URL search params (`SearchForm` + filter components write params; `getAllRecipes` reads the same param set). `PAGE_SIZE` and sort options are defined in `src/constants.ts`.

## Conventions

- Imports are auto-sorted by `simple-import-sort` (enforced by eslint) — don't hand-order.
- Prettier runs through eslint with `singleQuote: true`.
- Prefer the existing atom/molecule components over new one-off markup.
