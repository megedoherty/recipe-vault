import { ChangeEvent, RefObject, useEffect, useState } from 'react';

import Select from '@/components/atoms/Select/Select';
import { Occasion } from '@/types';

interface OccasionFilterProps {
  labelClassName?: string;
  updateActiveFilters: (filterName: string, isActive: boolean) => void;
  initialValue: string;
  occasions: Occasion[];
  formRef: RefObject<HTMLFormElement | null>;
}

export default function OccasionFilter({
  labelClassName,
  updateActiveFilters,
  initialValue,
  occasions,
  formRef,
}: OccasionFilterProps) {
  const [occasionId, setOccasionId] = useState(initialValue);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setOccasionId(value);
    updateActiveFilters('occasion', value !== '');
  };

  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const handleReset = () => {
      setOccasionId('');
      updateActiveFilters('occasion', false);
    };

    form.addEventListener('reset', handleReset);

    return () => {
      form.removeEventListener('reset', handleReset);
    };
  }, [formRef, updateActiveFilters]);

  return (
    <Select
      label="Occasion"
      name="occasionId"
      id="occasionId"
      value={occasionId}
      options={occasions.map((occasion) => ({
        value: occasion.id.toString(),
        label: occasion.name,
      }))}
      emptyOption={{ value: '', label: 'Select an occasion' }}
      direction="vertical"
      labelClassName={labelClassName}
      onChange={handleChange}
    />
  );
}
