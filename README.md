# Recipe Vault

A personal recipe manager. Paste a link to any recipe page and Recipe Vault scrapes it into a clean, editable recipe, without the life story and the ads. Search and filter your collection, track what you've made, and build a shopping list from the ingredients you need.

## Features

- **Import from a URL.** Uses the page's JSON-LD `Recipe` data when it has one, and falls back to HTML heuristics for ingredients (including ingredient sections), instructions, images, servings, category, meal type, and notes.
- **Edit everything.** Ingredient and instruction sections can be reordered with drag and drop. You can also edit equipment, storage info (room temperature or fridge, in days), category, and the hero image.
- **Search and filter.** Search by text and filter by ingredient, equipment, occasion, servings, rating, and whether you've made the recipe. Sort by last updated, name, newest, or oldest. All filter state lives in the URL, so a filtered view can be bookmarked or shared.
- **Ratings and "made it" tracking** on each recipe.
- **Shopping list.** Add selected ingredients from any recipe, check items off as you buy them, and choose whether to show quantities in grams.
- **Admin management** at `/manage` for categories, ingredients, and equipment. Admin only.
- **Accounts.** Email/password auth through Supabase. By default you see only your own recipes, with an optional filter to show everyone's. Recipes are readable by anyone, including signed-out visitors, but only the owner or an admin can change one. Admins are users with `app_metadata.role = 'admin'`, which only the Supabase dashboard or service role can set.

## Tech stack

| Layer     | Choice                                                    |
| --------- | --------------------------------------------------------- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) + React 19  |
| Language  | TypeScript (strict)                                       |
| Data/Auth | [Supabase](https://supabase.com) (Postgres, Auth, Storage) via `@supabase/ssr` |
| Parsing   | [cheerio](https://cheerio.js.org), `he`, `numeric-quantity` |
| Styling   | CSS Modules (no CSS framework)                            |
| Testing   | Jest + React Testing Library (jsdom)                      |
| Linting   | ESLint + Stylelint, with Prettier run through both        |

## Getting started

### Prerequisites

- Node.js 24 (see `.nvmrc`).
- A Supabase project
- The [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`) to apply migrations. Commands that read a remote schema (`db dump`, `db pull`) also need a Docker-compatible runtime, such as Docker Desktop or [Colima](https://github.com/abiosoft/colima).

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>

# Optional: fallback origin for sign-up confirmation emails
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Set up Supabase

The database schema and Row Level Security (RLS) policies live in `supabase/migrations/`. To set up a new project:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

This creates the tables (`recipe`, `recipe_ingredient`, `ingredient`, `recipe_equipment`, `equipment`, `category`, `meal_type`, `occasion`, `shopping_list_item`), their policies, and the `is_admin()` and `can_modify_recipe()` helper functions.

Migrations do **not** cover these, so set them up by hand in the dashboard:

- **Storage bucket:** create `recipe-images` (public), which holds imported recipe images. The bucket itself isn't created by migrations, but its access policies are: anyone can view images, any signed-in user can upload, and only the uploader or an admin can replace or delete an image.
- **Auth:** email/password enabled, with `<your-site>/auth/confirm` added as a redirect URL
- **Admin user:** set `app_metadata.role` to `admin` on your user (Authentication → Users) to use `/manage`

#### Changing the database

Make schema and policy changes as new migration files (`supabase migration new <name>`), not in the dashboard, so the files stay the source of truth. Apply them to a staging project first (`supabase link` to it, then `supabase db push`), run the RLS check against it, and only then push to production. The free Supabase plan has no automatic backups, so take a manual `supabase db dump` before pushing to production.

#### Testing RLS

`npm run test:rls` calls the API as signed-out, regular, and admin users and checks that the policies behave as intended. It creates throwaway users, so run it against **staging only**. It refuses to run against the production project.

```bash
RLS_TEST_REF=<staging-project-ref> npm run test:rls
```

It gets API keys through the Supabase CLI (you must be logged in), or you can supply `RLS_TEST_ANON_KEY` and `RLS_TEST_SERVICE_KEY`.

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visitors are redirected to the login page.

## Scripts

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Start the dev server at http://localhost:3000    |
| `npm run build`      | Production build                                 |
| `npm start`          | Serve the production build                       |
| `npm run lint`       | Lint JS/TS (ESLint) and CSS (Stylelint)          |
| `npm run lint:fix`   | Auto-fix lint issues in both                     |
| `npm test`           | Run the Jest test suite                          |
| `npm run test:rls`   | Check RLS policies against a staging Supabase project (see above) |

Run a single test file or a single test by name:

```bash
npx jest path/to/Component.test.tsx
npx jest -t "name of test"
```

## Project structure

```
src/
├── app/                    # App Router routes
│   ├── page.tsx            # Home: search, filter, and browse recipes
│   ├── recipes/add/        # Import a recipe from a URL
│   ├── recipes/[id]/       # View a recipe (and /edit)
│   ├── shopping-list/
│   ├── manage/             # Admin: categories, ingredients, equipment
│   └── auth/               # Login, signup, email confirmation
├── components/             # Shared UI, organized by atomic design
│   ├── atoms/              # Button, Input, Checkbox, icons, …
│   ├── molecules/          # Dialog, RecipeCard, editors, …
│   └── organisms/          # RecipeForm, section editors, …
├── lib/
│   ├── supabase/
│   │   ├── queries/        # Raw reads, return snake_case *Db shapes
│   │   ├── transforms.ts   # *Db shapes → camelCase FE types
│   │   └── server.ts, client.ts, proxy.ts
│   ├── actions/            # 'use server' mutations + recipe parser
│   │   └── recipeParser/
│   └── utils/              # Text parsing/normalization helpers
├── constants.ts            # PAGE_SIZE, sort options, etc.
└── types.ts                # All FE + DB types
supabase/
├── migrations/             # Schema and RLS policies (source of truth for the database)
├── tests/                  # RLS check (npm run test:rls)
└── config.toml             # Supabase CLI config
```

### How data flows

Data access is split into three layers:

1. **Queries** (`src/lib/supabase/queries/`) read from Supabase and return DB-shaped (`*Db`) objects.
2. **Transforms** (`src/lib/supabase/transforms.ts`) turn those into camelCase front-end types. They also validate JSON columns and apply section ordering.
3. **Server Actions** (`src/lib/actions/`) handle every write, including cleanup such as dropping empty steps and unlinking deleted ingredients from instruction steps.

Components never call the Supabase client directly. To add a field, update the query `select`, the `*Db` type, the FE type in `src/types.ts`, and the transform.

### Recipe import

`parseRecipeFromUrl` (`src/lib/actions/recipeParser/recipeParser.ts`) fetches the page, loads it into cheerio, and builds a recipe from JSON-LD first. HTML heuristics then fill in anything missing. Ingredients are always re-parsed from the HTML, because the schema.org `Recipe` type can't express ingredient sections. Text normalization lives in `src/lib/utils/parse.ts` and `regex.ts`.

## Conventions

- Each component is a folder containing `Component.tsx`, `Component.module.css`, and a colocated `Component.test.tsx`.
- Imports are sorted automatically by `simple-import-sort`, so don't order them by hand. Prettier uses `singleQuote: true`.
- Use the existing atoms and molecules before writing one-off markup.
- Supabase clients are created per request and never cached globally (see `src/lib/supabase/server.ts`).
- Change the database through migrations in `supabase/migrations/`, never directly in the dashboard.
- Admin checks exist in two places and must agree: `requireAdmin()` in app code, and the `is_admin()` RLS helper in the database.

## Deployment

This is a standard Next.js app and deploys to [Vercel](https://vercel.com) with no extra configuration. Set the same environment variables in your hosting provider, and add the production URL's `/auth/confirm` path to Supabase's allowed redirect URLs.

Database changes are not deployed by Vercel. Apply new migrations with `supabase db push` (staging first, then production), and decide per change whether the migration or the code should go out first.
