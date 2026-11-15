import { ChangeEvent, RefObject, useEffect, useState } from 'react';

import Checkbox from '@/components/atoms/Checkbox/Checkbox';

interface BookmarkedFilterProps {
  updateActiveFilters: (filterName: string, isActive: boolean) => void;
  initialValue: boolean;
  formRef: RefObject<HTMLFormElement | null>;
}

export default function BookmarkedFilter({
  updateActiveFilters,
  initialValue,
  formRef,
}: BookmarkedFilterProps) {
  const [bookmarked, setBookmarked] = useState(initialValue);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setBookmarked(isChecked);
    updateActiveFilters('bookmarked', isChecked);
  };

  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const handleReset = () => {
      setBookmarked(false);
      updateActiveFilters('bookmarked', false);
    };

    form.addEventListener('reset', handleReset);

    return () => {
      form.removeEventListener('reset', handleReset);
    };
  }, [formRef, updateActiveFilters]);

  return (
    <Checkbox
      name="bookmarked"
      label="Bookmarked recipes only"
      checked={bookmarked}
      onChange={handleChange}
      value="true"
      alignItems="center"
    />
  );
}
