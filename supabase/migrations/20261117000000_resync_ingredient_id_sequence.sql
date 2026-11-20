-- Ingredient rows were loaded with explicit ids, leaving the identity sequence
-- behind. New inserts then collide with existing ids (ingredient_catalog_pkey).
SELECT setval(
  pg_get_serial_sequence('public.ingredient', 'id'),
  COALESCE((SELECT MAX(id) FROM public.ingredient), 1),
  (SELECT MAX(id) IS NOT NULL FROM public.ingredient)
);
