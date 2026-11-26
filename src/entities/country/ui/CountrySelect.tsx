import { useMemo, useRef, useState } from "react";
import { Icon, SelectDropdown } from "@/shared/ui";
import { countries as allCountries, countryFlag } from "../model/country-data";
import { CountryFlag } from "./CountryFlag";

export interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  placeholder?: string;
  className?: string;
  countries?: readonly string[];
}

export function CountrySelect({
  value,
  onChange,
  placeholder = "Choose a country",
  className = "",
  countries: allowedCountries,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedCode = countryFlag(value);
  const availableCountries =
    allowedCountries && allowedCountries.length > 0 ? allowedCountries : allCountries;

  const options = useMemo(
    () =>
      availableCountries.map((country) => ({
        value: country,
        label: country,
        icon: <CountryFlag code={countryFlag(country)} country={country} />,
      })),
    [availableCountries],
  );

  return (
    <div className={`country-select relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="country-select-trigger flex w-full h-10 items-center gap-2 px-3 border border-line rounded-[2px] bg-paper text-ink text-[11px] text-left hover:border-ink transition-colors cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {value ? (
          <CountryFlag code={selectedCode} country={value} />
        ) : (
          <span className="country-flag-empty w-4 h-3 bg-soft border border-line rounded-xs" />
        )}
        <strong className="flex-1 font-medium truncate">{value || placeholder}</strong>
        <Icon
          name="chevron"
          size={16}
          className={`text-muted transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      <SelectDropdown
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        ariaLabel="Select country"
        options={options}
        value={value}
        onSelect={onChange}
        searchable
        searchPlaceholder="Search countries"
        emptyMessage="No matching countries."
        minWidth={240}
      />
    </div>
  );
}
