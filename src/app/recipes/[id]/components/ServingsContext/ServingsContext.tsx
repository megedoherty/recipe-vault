'use client';

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

interface ServingsContextValue {
  // The servings currently selected
  servings: number;
  setServings: (servings: number) => void;
  // The servings the recipe was written for, used as the base for scaling
  baseServings: number;
  canScale: boolean;
  // Multiplier to apply to ingredient quantities
  factor: number;
}

const ServingsContext = createContext<ServingsContextValue>({
  servings: 0,
  setServings: () => {},
  baseServings: 0,
  canScale: false,
  factor: 1,
});

interface ServingsProviderProps {
  baseServings: number | null;
  children: ReactNode;
}

// Shares the selected servings between the scaler (shown with the recipe info)
// and the ingredients it scales. Renders no markup of its own.
export function ServingsProvider({
  baseServings,
  children,
}: ServingsProviderProps) {
  const base = baseServings ?? 0;
  const [servings, setServings] = useState(base);
  const canScale = base > 0;

  const value = useMemo(
    () => ({
      servings,
      setServings,
      baseServings: base,
      canScale,
      factor: canScale ? servings / base : 1,
    }),
    [servings, base, canScale],
  );

  return (
    <ServingsContext.Provider value={value}>
      {children}
    </ServingsContext.Provider>
  );
}

export function useServings() {
  return useContext(ServingsContext);
}
