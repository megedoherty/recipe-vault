import { IngredientCatalogDb, IngredientCatalogEntry } from '@/types';

import { createClient } from '../server';

const transformIngredientCatalog = (
  data: IngredientCatalogDb[],
): IngredientCatalogEntry[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    parentId: item.parent_id,
    category: item.category,
  }));
};

export async function getIngredientCatalog(): Promise<
  IngredientCatalogEntry[]
> {
  const supabase = await createClient();
  const { data } = await supabase.from('ingredient_catalog').select('*');
  return data ? transformIngredientCatalog(data) : [];
}
