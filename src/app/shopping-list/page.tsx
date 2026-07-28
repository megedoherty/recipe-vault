import { Metadata } from 'next';
import { cookies } from 'next/headers';

import { PREFER_GRAMS_COOKIE } from '@/constants';
import { getShoppingListItems } from '@/lib/supabase/queries/shoppingList';

import ShoppingListView from './components/ShoppingListView/ShoppingListView';
import styles from './page.module.css';

export default async function ShoppingListPage() {
  const [items, cookieStore] = await Promise.all([
    getShoppingListItems(),
    cookies(),
  ]);
  const initialPreferGrams =
    cookieStore.get(PREFER_GRAMS_COOKIE)?.value !== 'false';

  return (
    <div className={styles.page}>
      <ShoppingListView items={items} initialPreferGrams={initialPreferGrams} />
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Shopping List | Recipe Vault',
};
