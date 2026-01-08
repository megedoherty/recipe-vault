import { useEffect, useRef, useState } from 'react';

import Button, { ButtonProps } from '@/components/atoms/Button/Button';
import Checkbox from '@/components/atoms/Checkbox/Checkbox';
import TextInput from '@/components/atoms/TextInput/TextInput';

import styles from './SelectableSearchPopover.module.css';

interface SearchItem {
  id: string;
  name: string;
}

interface SelectableSearchPopoverProps<T extends SearchItem> {
  // popover container
  popoverId: string;
  popoverAriaLabel: string;
  // search input
  searchPlaceholder: string;
  searchLabel: string;
  searchId: string;
  // open button
  buttonText: string;
  buttonClassName?: string;
  buttonSize?: ButtonProps['size'];
  // no results text
  noResultsText: string;
  // items
  items: T[];
  groupItems: (items: T[]) => Record<string, T[]>;
  getItemLabel: (item: T) => string;
  getItemChecked: (itemId: string) => boolean;
  onToggleItem: (itemId: string) => void;
  getIndentationLevel?: (item: T) => number;
  // unique props
  canSelectMultiple?: boolean;
}

export default function SelectableSearchPopover<T extends SearchItem>({
  popoverId,
  popoverAriaLabel,
  searchPlaceholder,
  searchLabel,
  searchId,
  buttonText,
  buttonSize = 'small',
  buttonClassName,
  noResultsText,
  items,
  groupItems,
  getItemLabel,
  getItemChecked,
  getIndentationLevel,
  onToggleItem,
  canSelectMultiple = false,
}: SelectableSearchPopoverProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close the popover and clear the search term
  const closePopover = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  // Toggle the item selection and close if its single select and the item is being checked
  const onToggleItemSelection = (itemId: string, isChecked: boolean) => {
    // Close if its single select and the item is being checked
    if (!canSelectMultiple && isChecked) {
      closePopover();
    }
    onToggleItem(itemId);
  };

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        !popoverRef.current?.contains(e.target as Node) &&
        !containerRef.current?.contains(e.target as Node)
      ) {
        closePopover();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Return focus to the button when the popover is closed
  useEffect(() => {
    if (!isOpen && buttonRef.current) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        buttonRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Items to be displayed
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const groupedItems = groupItems(filteredItems);

  return (
    <div className={styles.container} ref={containerRef}>
      <Button
        variant="secondary"
        size={buttonSize}
        onClick={() => {
          setIsOpen((prev) => {
            const newIsOpen = !prev;
            if (!newIsOpen) {
              closePopover();
            }
            return newIsOpen;
          });
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        className={buttonClassName}
        ref={buttonRef}
      >
        {buttonText}
      </Button>
      {isOpen && (
        <div
          className={styles.popoverContainer}
          ref={popoverRef}
          id={popoverId}
          role="listbox"
          aria-label={popoverAriaLabel}
        >
          <div className={styles.inputContainer}>
            <TextInput
              label={searchLabel}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              id={searchId}
              name={searchId}
              type="text"
              hideLabel
            />
          </div>
          <div className={styles.itemsList}>
            {filteredItems.length === 0 ? (
              <div className={styles.noItems}>
                <p>{noResultsText}</p>
              </div>
            ) : (
              Object.entries(groupedItems).map(([section, items]) => {
                if (items?.length === 0) return null;
                return (
                  <div
                    key={section}
                    className={styles.itemSection}
                    role="group"
                    aria-label={section || 'Items'}
                  >
                    {section && (
                      <div className={styles.sectionName}>{section}</div>
                    )}
                    <div className={styles.itemsContainer}>
                      {items?.map((item) => (
                        <Checkbox
                          key={item.id}
                          label={getItemLabel(item)}
                          checkboxSize="small"
                          labelSize="small"
                          onChange={(e) =>
                            onToggleItemSelection(item.id, e.target.checked)
                          }
                          id={item.id}
                          checked={getItemChecked(item.id)}
                          checkboxClassName={`${styles.checkbox} ${getIndentationLevel?.(item) ? styles[`indent-${getIndentationLevel(item)}`] : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
