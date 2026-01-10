import { Dispatch, SetStateAction } from 'react';

import SelectableSearchPopover from '@/components/molecules/SelectableSearchPopover/SelectableSearchPopover';
import { Equipment } from '@/types';

import styles from './EquipmentSelect.module.css';

interface EquipmentSelectProps {
  selectedEquipment: string[];
  setSelectedEquipment: Dispatch<SetStateAction<string[]>>;
  equipment: Equipment[];
}

export default function EquipmentSelect({
  selectedEquipment,
  setSelectedEquipment,
  equipment,
}: EquipmentSelectProps) {
  return (
    <div className={styles.container}>
      <SelectableSearchPopover
        popoverId="equipment-picker-popover"
        popoverAriaLabel="Equipment picker"
        searchPlaceholder="Equipment name"
        searchLabel="Search equipment"
        searchId="equipment-picker-search"
        buttonContent="Equipment"
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
      />
      <p className={styles.selectedEquipment}>
        {'- '}
        {selectedEquipment.length === 0
          ? 'None'
          : equipment
              .filter((e) => selectedEquipment.includes(e.id))
              .map((e) => e.name)
              .join(', ')}
      </p>
    </div>
  );
}
