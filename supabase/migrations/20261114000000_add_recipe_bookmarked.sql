-- Bookmarked recipes: a per-recipe flag the owner uses to queue recipes they
-- want to make soon. Bookmarks are owner-only (the UI and server action only
-- allow the owner to set it), so a column is enough; the existing recipe
-- UPDATE policy already controls who can write it.
ALTER TABLE public.recipe
  ADD COLUMN IF NOT EXISTS bookmarked boolean NOT NULL DEFAULT false;

-- "Last updated" is the default sort, so flipping a bookmark must not count as
-- an edit. Replace the moddatetime trigger with one that leaves updated_at
-- alone when the only change is to `bookmarked`. Comparing the rows as jsonb
-- means future columns are picked up automatically.
CREATE OR REPLACE FUNCTION public.set_recipe_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (to_jsonb(NEW) - 'bookmarked' - 'updated_at')
     IS DISTINCT FROM (to_jsonb(OLD) - 'bookmarked' - 'updated_at') THEN
    NEW.updated_at = now();
  ELSE
    NEW.updated_at = OLD.updated_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "handle_updated_at" ON public.recipe;

CREATE TRIGGER "handle_updated_at"
  BEFORE UPDATE ON public.recipe
  FOR EACH ROW EXECUTE FUNCTION public.set_recipe_updated_at();
