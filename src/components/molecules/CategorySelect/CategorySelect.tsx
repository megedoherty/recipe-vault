import Select from '@/components/atoms/Select/Select';
import { Category } from '@/types';

interface CategorySelectProps {
  name?: string;
  defaultValue?: string;
  categories: Category[];
  showEmptyOption?: boolean;
  hideLabel?: boolean;
  selectClassName?: string;
}

export default function CategorySelect({
  name = 'categoryId',
  defaultValue,
  categories,
  showEmptyOption = false,
  hideLabel = false,
  selectClassName = '',
}: CategorySelectProps) {
  return (
    <Select
      label="Category"
      name={name}
      id="category"
      defaultValue={defaultValue}
      hideLabel={hideLabel}
      options={categories.map((category) => ({
        value: category.id.toString(),
        label: category.name,
      }))}
      emptyOption={
        showEmptyOption ? { value: '', label: 'Select a category' } : undefined
      }
      selectClassName={selectClassName}
    />
  );
}
