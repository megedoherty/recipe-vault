-- One recipe per (user, source URL). source_url is stored normalized by the app
-- (see normalizeSourceUrl in src/lib/utils/url.ts).
--
-- Existing duplicates must be reviewed and removed by hand BEFORE applying this,
-- since they are user data. Find them with:
--   select user_id, source_url, count(*), array_agg(id)
--   from public.recipe
--   where source_url is not null and source_url <> ''
--   group by 1, 2 having count(*) > 1;

-- Empty strings were stored for recipes without a URL; treat them as no URL
update public.recipe set source_url = null where btrim(source_url) = '';

create unique index recipe_user_source_url_key
  on public.recipe (user_id, source_url)
  where source_url is not null;
