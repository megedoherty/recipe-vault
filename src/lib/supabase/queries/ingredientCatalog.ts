import { IngredientCatalog, IngredientCatalogDb } from '@/types';

import { createClient } from '../server';

const transformIngredientCatalog = (
  data: IngredientCatalogDb[],
): IngredientCatalog[] => {
  return data.map((item) => ({
    id: item.id,
    name: item.name,
    parentId: item.parent_id,
    category: item.category,
  }));
};

export async function getIngredientCatalog(): Promise<IngredientCatalog[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('ingredient_catalog').select('*');
  return data ? transformIngredientCatalog(data) : [];
}
