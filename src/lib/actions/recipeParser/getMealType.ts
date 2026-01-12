const mealTypeMap = {
  muffin: 'Breakfast',
  biscuit: 'Breakfast',
};

// Hardcoded logic for the meal types
export const getMealType = (text: string, categoryName: string) => {
  if (
    [
      'Brownies & Bars',
      'Candy',
      'Cakes',
      'Cookies',
      'Cupcakes',
      'Pastry',
      'Pies & Tarts',
    ].includes(categoryName)
  ) {
    return 'Dessert';
  }

  for (const [keyword, mealType] of Object.entries(mealTypeMap)) {
    if (text.toLowerCase().includes(keyword)) {
      return mealType;
    }
  }

  return null;
};
