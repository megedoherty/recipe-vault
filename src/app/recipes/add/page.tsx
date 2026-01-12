import { redirect } from 'next/navigation';

import { getCategories } from '@/lib/supabase/queries/categories';
import { getEquipment } from '@/lib/supabase/queries/equipment';
import { getIngredientsForRecipeEdit } from '@/lib/supabase/queries/ingredients';
import { getMealTypes } from '@/lib/supabase/queries/mealTypes';
import { getOccasions } from '@/lib/supabase/queries/occasions';
import { isUserLoggedIn } from '@/lib/supabase/queries/user';

import AddRecipeChoice from './components/AddRecipeChoice/AddRecipeChoice';
import styles from './page.module.css';

export default async function AddRecipePage() {
  const categories = await getCategories();
  const ingredients = await getIngredientsForRecipeEdit();
  const equipment = await getEquipment();
  const mealTypes = await getMealTypes();
  const occasions = await getOccasions();

  const isLoggedIn = await isUserLoggedIn();

  if (!isLoggedIn) {
    redirect('/auth/login');
  }

  return (
    <div className={styles.page}>
      <h1>Add Recipe</h1>
      <AddRecipeChoice
        categories={categories}
        ingredients={ingredients}
        equipment={equipment}
        mealTypes={mealTypes}
        occasions={occasions}
      />
    </div>
  );
}
