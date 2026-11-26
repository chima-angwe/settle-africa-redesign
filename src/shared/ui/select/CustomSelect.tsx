import { useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/shared/ui/icon";
import { SelectDropdown } from "./SelectDropdown";
import {
  normalizeSelectOption,
  type SelectOptionInput,
} from "./select.types";

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOptionInput[];
  placeholder?: string;
  modalTitle?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  className?: string;
  triggerClassName?: string;
  leftIcon?: ReactNode;
  hasError?: boolean;
  align?: "left" | "right";
  minMenuWidth?: number;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  modalTitle,
  searchable,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
  id,
  ariaLabel,
  className = "",
  triggerClassName,
  leftIcon,
  hasError = false,
  align = "left",
  minMenuWidth,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const normalizedOptions = useMemo(
    () => options.map(normalizeSelectOption),
    [options],
  );

  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => option.value === value),
    [normalizedOptions, value],
  );

  const resolvedAriaLabel = ariaLabel || modalTitle || placeholder;
  const displayIcon = selectedOption?.icon ?? leftIcon;
  const displayLabel = selectedOption?.label ?? placeholder;
  const isPlaceholder = !selectedOption;

  return (
    <div className={`min-w-0 ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-label={resolvedAriaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-2 border bg-paper text-left transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${
          hasError
            ? "border-rose-500"
            : open
              ? "border-ink"
              : "border-line hover:border-ink/50 focus:border-ink"
        } ${triggerClassName ?? "h-11 px-3.5 rounded-xl text-sm font-medium"}`}
      >
        <span className="flex items-center gap-2 min-w-0 flex-1">
          {displayIcon && (
            <span className="shrink-0 flex items-center">{displayIcon}</span>
          )}
          <span
            className={`truncate ${
              isPlaceholder ? "text-subtle font-normal" : "text-ink"
            }`}
          >
            {displayLabel}
          </span>
        </span>
        <Icon
          name="chevron"
          size={14}
          className={`text-muted shrink-0 transition-transform ${
            open ? "-rotate-90" : "rotate-90"
          }`}
        />
      </button>

      <SelectDropdown
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        ariaLabel={resolvedAriaLabel}
        options={normalizedOptions}
        value={value}
        onSelect={onChange}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage}
        align={align}
        minWidth={minMenuWidth}
      />
    </div>
  );
}
