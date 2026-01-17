import { StorageInfo } from './types';

export const storageLocations = ['Room Temperature', 'Fridge'] as const;

export const defaultStorage: StorageInfo[] = [
  {
    location: 'Room Temperature',
    days: null,
  },
  {
    location: 'Fridge',
    days: null,
  },
];

export const sortOptions = [
  { value: 'last_updated', label: 'Last Updated' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
] as const;

export type SortOption = (typeof sortOptions)[number]['value'];

export const isSortOption = (value: unknown): value is SortOption => {
  return (
    typeof value === 'string' &&
    sortOptions.some((option) => option.value === value)
  );
};

export const PAGE_SIZE = 24 as const;
