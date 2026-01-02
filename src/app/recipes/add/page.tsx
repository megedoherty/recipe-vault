import CreateRecipeForm from './components/CreateRecipeForm/CreateRecipeForm';
import styles from './page.module.css';

export default function AddRecipePage() {
  return (
    <div className={styles.page}>
      <h1>Add Recipe</h1>
      <h2>Add a recipe manually</h2>
      <CreateRecipeForm />
    </div>
  );
}
