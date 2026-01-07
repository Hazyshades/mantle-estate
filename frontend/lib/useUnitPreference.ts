import { useState, useEffect } from "react";

export type UnitType = "sqft" | "sqm";

const STORAGE_KEY = "unit_preference";
const DEFAULT_UNIT: UnitType = "sqft";

const SQFT_TO_SQM = 0.092903; // 1 sqft = 0.092903 sqm
const SQM_TO_SQFT = 1 / SQFT_TO_SQM; // 1 sqm = 10.7639 sqft

export function useUnitPreference() {
  const [unitType, setUnitType] = useState<UnitType>(() => {
    // Initialize from localStorage or use default
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "sqft" || stored === "sqm") {
        return stored as UnitType;
      }
    }
    return DEFAULT_UNIT;
  });

  // Save to localStorage whenever unitType changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, unitType);
    }
  }, [unitType]);

  // Convert sqft to current unit
  const convertFromSqft = (sqft: number): number => {
    return unitType === "sqm" ? sqft * SQFT_TO_SQM : sqft;
  };

  // Convert current unit to sqft
  const convertToSqft = (value: number): number => {
    return unitType === "sqm" ? value * SQM_TO_SQFT : value;
  };

  // Get unit label
  const getUnitLabel = (): string => {
    return unitType === "sqm" ? "Sqm" : "Sqft";
  };

  // Get unit label lowercase
  const getUnitLabelLower = (): string => {
    return unitType === "sqm" ? "sqm" : "sqft";
  };

  return {
    unitType,
    setUnitType,
    convertFromSqft,
    convertToSqft,
    getUnitLabel,
    getUnitLabelLower,
  };
}

