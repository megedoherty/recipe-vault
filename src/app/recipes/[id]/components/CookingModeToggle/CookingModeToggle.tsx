'use client';

import { ChangeEvent } from 'react';

import Switch from '@/components/atoms/Switch/Switch';
import useWakeLock from '@/lib/hooks/useWakeLock';

export default function CookingModeToggle() {
  const { isSupported, isActive, request, release } = useWakeLock();

  if (!isSupported) {
    return null;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      request();
    } else {
      release();
    }
  };

  return (
    <Switch
      label="Cooking mode"
      title="Keeps your screen awake while cooking"
      checked={isActive}
      onChange={handleChange}
    />
  );
}
