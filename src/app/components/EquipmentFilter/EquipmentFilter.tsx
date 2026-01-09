import { useState } from 'react';

import SelectableSearchPopover from '@/components/molecules/SelectableSearchPopover/SelectableSearchPopover';
import { Equipment } from '@/types';

import styles from './EquipmentSelect.module.css';

interface EquipmentSelectProps {
  equipment: Equipment[];
  initialValue?: string[];
  buttonClassName?: string;
}

export default function EquipmentSelect({
  equipment,
  initialValue = [],
  buttonClassName,
}: EquipmentSelectProps) {
  const [selectedEquipment, setSelectedEquipment] =
    useState<string[]>(initialValue);

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
