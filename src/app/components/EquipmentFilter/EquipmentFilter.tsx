import { RefObject, useEffect, useState } from 'react';

import SelectableSearchPopover from '@/components/molecules/SelectableSearchPopover/SelectableSearchPopover';
import { Equipment } from '@/types';

const EMPTY: string[] = [];

interface EquipmentFilterProps {
  equipment: Equipment[];
  initialValue?: string[];
  buttonClassName?: string;
  updateActiveFilters?: (filterName: string, isActive: boolean) => void;
  formRef?: RefObject<HTMLFormElement | null>;
}

export default function EquipmentFilter({
  equipment,
  initialValue = EMPTY,
  buttonClassName,
  updateActiveFilters,
  formRef,
}: EquipmentFilterProps) {
  const [selectedEquipment, setSelectedEquipment] =
    useState<string[]>(initialValue);

  // Update parent component when selected equipment changes
  useEffect(() => {
    if (updateActiveFilters) {
      updateActiveFilters('equipment', selectedEquipment.length > 0);
    }
  }, [selectedEquipment.length, updateActiveFilters]);

  // Handle form reset
  useEffect(() => {
    if (!formRef?.current) {
      return;
    }

    const handleReset = () => {
      setSelectedEquipment([]);
      if (updateActiveFilters) {
        updateActiveFilters('equipment', false);
      }
    };

    const form = formRef.current;
    form.addEventListener('reset', handleReset);

    return () => {
      form.removeEventListener('reset', handleReset);
    };
  }, [formRef, updateActiveFilters]);

  return (
    <>
      <SelectableSearchPopover
        popoverId="equipment-filter-popover"
        popoverAriaLabel="Equipment picker"
        searchPlaceholder="Equipment name"
        searchLabel="Search equipment"
        searchId="equipment-filter-search"
        buttonContent={`Equipment${selectedEquipment.length > 0 ? ` (${selectedEquipment.length})` : ''}`}
        openDirection="left"
        noResultsText="No equipment found"
        items={equipment}
        groupItems={(items) => ({
          '': items,
        })}
        getItemLabel={(item) => item.name}
        getItemChecked={(itemId) => selectedEquipment.includes(itemId)}
        onToggleItem={(itemId) =>
          setSelectedEquipment((prev) =>
            prev.includes(itemId)
              ? prev.filter((id) => id !== itemId)
              : [...prev, itemId],
          )
        }
        buttonSize="medium"
        canSelectMultiple
        buttonClassName={buttonClassName}
      />
      <input
        key="equipment"
        type="hidden"
        name="equipment"
        value={selectedEquipment.join(',')}
      />
    </>
  );
}
