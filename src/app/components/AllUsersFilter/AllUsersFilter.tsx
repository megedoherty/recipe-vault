import { ChangeEvent, RefObject, useEffect, useState } from 'react';

import Checkbox from '@/components/atoms/Checkbox/Checkbox';

interface AllUsersFilterProps {
  updateActiveFilters: (filterName: string, isActive: boolean) => void;
  initialValue: boolean;
  formRef: RefObject<HTMLFormElement | null>;
}

export default function AllUsersFilter({
  updateActiveFilters,
  initialValue,
  formRef,
}: AllUsersFilterProps) {
  const [includeAllUsers, setIncludeAllUsers] = useState(initialValue);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIncludeAllUsers(isChecked);
    updateActiveFilters('includeAllUsers', isChecked);
  };

  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const handleReset = () => {
      setIncludeAllUsers(false);
      updateActiveFilters('includeAllUsers', false);
    };

    form.addEventListener('reset', handleReset);

    return () => {
      form.removeEventListener('reset', handleReset);
    };
  }, [formRef, updateActiveFilters]);

  return (
    <Checkbox
      id="includeAllUsers"
      name="includeAllUsers"
      label="Show all users' recipes"
      checked={includeAllUsers}
      onChange={handleChange}
      value="true"
      alignItems="start"
    />
  );
}
