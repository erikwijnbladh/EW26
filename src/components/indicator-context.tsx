"use client";

import { createContext, useContext, useState } from "react";

type IndicatorState = {
  /** True while the floating indicator is away from its resting spot. */
  traveling: boolean;
  setTraveling: (v: boolean) => void;
};

const IndicatorContext = createContext<IndicatorState>({
  traveling: false,
  setTraveling: () => {},
});

export function IndicatorProvider({ children }: { children: React.ReactNode }) {
  const [traveling, setTraveling] = useState(false);
  return (
    <IndicatorContext.Provider value={{ traveling, setTraveling }}>
      {children}
    </IndicatorContext.Provider>
  );
}

export const useIndicator = () => useContext(IndicatorContext);
