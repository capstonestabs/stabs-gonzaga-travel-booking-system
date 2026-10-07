export interface EntranceFeeCategory {
  id: string;
  label: string;
  minAge: number;
  maxAge: number | null;
  amount: number;
}

export const DEFAULT_ENTRANCE_FEE_CATEGORIES: EntranceFeeCategory[] = [
  { id: "child", label: "Child", minAge: 3, maxAge: 17, amount: 0 },
  { id: "adult", label: "Adults", minAge: 18, maxAge: 59, amount: 0 },
  { id: "senior", label: "Senior", minAge: 60, maxAge: null, amount: 0 }
];

export function formatEntranceFeeAgeRange(category: Pick<EntranceFeeCategory, "minAge" | "maxAge">) {
  if (category.maxAge === null) return `Ages ${category.minAge} & above`;
  return `${category.minAge} - ${category.maxAge} years`;
}
