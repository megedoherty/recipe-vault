-- Restrict the recipe-images bucket to the uploader (or an admin).
--
-- Before this migration, every authenticated user could update and delete ANY
-- object in the bucket (the only check was bucket_id). Supabase records the
-- uploader in storage.objects.owner_id, so ownership needs no change to
-- filenames or app code. All existing objects have owner_id set.
--
-- Public SELECT is kept (recreated here under a clearer name, so this migration
-- does not depend on the hand-made policy existing). Recipe images stay viewable
-- by anyone, including signed-out visitors. A SELECT policy is also required for
-- deletes to work: Postgres checks it for statements that filter or return rows.
--
-- Note: the INSERT policy still allows any signed-in user to upload to the
-- bucket. Uploaded objects are owned by the uploader, so only they (or an
-- admin) can later replace or delete them.

DROP POLICY IF EXISTS "All for auth users 1rpf4wn_0" ON storage.objects; -- INSERT
DROP POLICY IF EXISTS "All for auth users 1rpf4wn_1" ON storage.objects; -- UPDATE
DROP POLICY IF EXISTS "All for auth users 1rpf4wn_2" ON storage.objects; -- SELECT (public SELECT already covers it)
DROP POLICY IF EXISTS "All for auth users 1rpf4wn_3" ON storage.objects; -- DELETE

DROP POLICY IF EXISTS "Select for all 1rpf4wn_0" ON storage.objects; -- old name of the public SELECT

DROP POLICY IF EXISTS "Anyone can view recipe images" ON storage.objects;
CREATE POLICY "Anyone can view recipe images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'recipe-images');

DROP POLICY IF EXISTS "Signed-in users can upload recipe images" ON storage.objects;
CREATE POLICY "Signed-in users can upload recipe images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recipe-images');

DROP POLICY IF EXISTS "Uploader or admin can update recipe images" ON storage.objects;
CREATE POLICY "Uploader or admin can update recipe images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND (owner_id = (SELECT auth.uid())::text OR public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND (owner_id = (SELECT auth.uid())::text OR public.is_admin())
  );

DROP POLICY IF EXISTS "Uploader or admin can delete recipe images" ON storage.objects;
CREATE POLICY "Uploader or admin can delete recipe images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'recipe-images'
    AND (owner_id = (SELECT auth.uid())::text OR public.is_admin())
  );
