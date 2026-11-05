-- Tighten Row Level Security.
--
-- Before this migration, any authenticated user could update any recipe,
-- write any recipe_ingredient / recipe_equipment row, and write categories.
-- Admin-only writes were enforced in app code (requireAdmin) but not in the
-- database, and equipment/ingredient had no write policies at all.
--
-- Unchanged: public SELECT on all lookup tables and recipe tables,
-- recipe INSERT (owner only), and every shopping_list_item policy.

-- Admin status lives in app_metadata, which only the service role / dashboard
-- can write (see isAdmin() in src/lib/supabase/queries/user.ts).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce((SELECT auth.jwt()) -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

-- True when the recipe belongs to the current user. Admins can modify any
-- recipe (mirrors canModifyRecipe() in the app).
CREATE OR REPLACE FUNCTION public.can_modify_recipe(recipe_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.recipe r
    WHERE r.id = recipe_id AND r.user_id = (SELECT auth.uid())
  );
$$;

-- recipe -------------------------------------------------------------
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.recipe;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.recipe;

CREATE POLICY "Owner or admin can update recipe" ON public.recipe
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin())
  WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

CREATE POLICY "Owner or admin can delete recipe" ON public.recipe
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());

-- recipe_ingredient --------------------------------------------------
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.recipe_ingredient;
DROP POLICY IF EXISTS "update_any_row_authenticated" ON public.recipe_ingredient;
DROP POLICY IF EXISTS "delete_any_row_authenticated" ON public.recipe_ingredient;

CREATE POLICY "Recipe owner or admin can insert ingredients" ON public.recipe_ingredient
  FOR INSERT TO authenticated
  WITH CHECK (public.can_modify_recipe(recipe_id));

CREATE POLICY "Recipe owner or admin can update ingredients" ON public.recipe_ingredient
  FOR UPDATE TO authenticated
  USING (public.can_modify_recipe(recipe_id))
  WITH CHECK (public.can_modify_recipe(recipe_id));

CREATE POLICY "Recipe owner or admin can delete ingredients" ON public.recipe_ingredient
  FOR DELETE TO authenticated
  USING (public.can_modify_recipe(recipe_id));

-- recipe_equipment ---------------------------------------------------
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.recipe_equipment;
DROP POLICY IF EXISTS "delete_policy" ON public.recipe_equipment;

CREATE POLICY "Recipe owner or admin can insert equipment" ON public.recipe_equipment
  FOR INSERT TO authenticated
  WITH CHECK (public.can_modify_recipe(recipe_id));

CREATE POLICY "Recipe owner or admin can delete equipment" ON public.recipe_equipment
  FOR DELETE TO authenticated
  USING (public.can_modify_recipe(recipe_id));

-- category (admin only writes) ---------------------------------------
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.category;
DROP POLICY IF EXISTS "update_any_row_authenticated" ON public.category;
DROP POLICY IF EXISTS "delete_any_row_authenticated" ON public.category;

CREATE POLICY "Admin can insert category" ON public.category
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update category" ON public.category
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete category" ON public.category
  FOR DELETE TO authenticated USING (public.is_admin());

-- ingredient and equipment (admin only writes; previously none existed) --
CREATE POLICY "Admin can insert ingredient" ON public.ingredient
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update ingredient" ON public.ingredient
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admin can insert equipment" ON public.equipment
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update equipment" ON public.equipment
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
