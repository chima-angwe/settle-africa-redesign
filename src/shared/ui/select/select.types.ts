import type { ReactNode } from "react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: ReactNode;
  searchText?: string;
  disabled?: boolean;
}

export type SelectOptionInput = string | SelectOption;

export function normalizeSelectOption(option: SelectOptionInput): SelectOption {
  if (typeof option === "string") {
    return { value: option, label: option };
  }
  return option;
}
