import { Category } from '@/types';

const categoryAliases = {
  'rice krispie treats': 'Brownies & Bars',
  truffle: 'Candy',
  fudge: 'Candy',
  rolls: 'Bread',
  cupcake: 'Cupcakes', // Prevent cakes from taking precedence
};

export const getCategoryId = (categories: Category[], text: string) => {
  const lowercaseText = text.toLowerCase();

  // Check special aliases first
  for (const [alias, category] of Object.entries(categoryAliases)) {
    if (lowercaseText.includes(alias)) {
      return categories.find((c) => c.name === category)?.id ?? null;
    }
  }

  for (const category of categories) {
    const subCategories = category.name.split(' & ');
    for (const subCategory of subCategories) {
      const subcategorySingular = subCategory.replace(/s$/, '').toLowerCase();
      if (lowercaseText.includes(subcategorySingular)) {
        return category.id;
      }
    }
  }
  return null;
};
