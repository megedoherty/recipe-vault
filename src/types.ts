export interface Recipe {
  created_at: string;
  hasMade: boolean | null;
  id: number;
  imageUrl: string | null;
  ingredients: string[] | null; // Technically a JSON array of strings
  instructions: string[] | null; // Technically a JSON array of strings
  name: string;
  sourceUrl: string | null;
}
