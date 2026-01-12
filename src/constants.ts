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
