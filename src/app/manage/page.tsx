import { redirect } from 'next/navigation';

import Tabs from '@/components/atoms/Tabs/Tabs';
import { addCategory, updateCategory } from '@/lib/actions/categories';
import { addEquipment, updateEquipment } from '@/lib/actions/equipment';
import { getCategories } from '@/lib/supabase/queries/categories';
import { getEquipment } from '@/lib/supabase/queries/equipment';
import {
  getIngredientCategories,
  getIngredientsForManage,
} from '@/lib/supabase/queries/ingredients';
import { getUser, isAdmin } from '@/lib/supabase/queries/user';

import IngredientManager from './components/IngredientManager/IngredientManager';
import NameListManager from './components/NameListManager/NameListManager';
import styles from './page.module.css';

export default async function ManagePage() {
  if (!isAdmin(await getUser())) {
    redirect('/');
  }

  const [categories, equipment, ingredients, ingredientCategories] =
    await Promise.all([
      getCategories(),
      getEquipment(),
      getIngredientsForManage(),
      getIngredientCategories(),
    ]);

  return (
    <div className={styles.page}>
      <h1>Manage</h1>
      <Tabs
        label="Manage"
        tabs={[
          {
            id: 'categories',
            label: 'Categories',
            content: (
              <NameListManager
                title="Categories"
                placeholder="Category Name"
                entries={categories}
                addEntry={addCategory}
                updateEntry={updateCategory}
              />
            ),
          },
          {
            id: 'equipment',
            label: 'Equipment',
            content: (
              <NameListManager
                title="Equipment"
                placeholder="Equipment Name"
                entries={equipment.map((e) => ({
                  id: Number(e.id),
                  name: e.name,
                }))}
                addEntry={addEquipment}
                updateEntry={updateEquipment}
              />
            ),
          },
          {
            id: 'ingredients',
            label: 'Ingredients',
            content: (
              <IngredientManager
                ingredients={ingredients}
                categories={ingredientCategories}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
