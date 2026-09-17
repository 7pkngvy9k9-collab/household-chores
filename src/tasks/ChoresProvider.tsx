import { createContext, useContext, type ReactNode } from "react";

import { useHousehold } from "../household/HouseholdProvider";
import { useChores, type ChoresValue } from "./useChores";

const ChoresContext = createContext<ChoresValue | null>(null);

export function ChoresProvider({ children }: { children: ReactNode }) {
  const { household, currentMemberId } = useHousehold();
  const value = useChores(household?.id ?? null, currentMemberId);
  return <ChoresContext.Provider value={value}>{children}</ChoresContext.Provider>;
}

export function useHouseholdChores(): ChoresValue {
  const value = useContext(ChoresContext);
  if (!value) throw new Error("useHouseholdChores must be used inside a ChoresProvider");
  return value;
}
