import { useMemo, useRef, useState } from "react";
import { Icon, SelectDropdown } from "@/shared/ui";
import {
  countries as allCountries,
  countryCurrencies,
  countryFlag,
} from "../model/country-data";
import { CountryFlag } from "./CountryFlag";

export interface CountryCurrencySelectProps {
  country: string;
  onChange: (country: string, currency: string) => void;
  ariaLabel?: string;
  align?: "left" | "right";
  className?: string;
  triggerClassName?: string;
  countries?: readonly string[];
}

export function CountryCurrencySelect({
  country,
  onChange,
  ariaLabel = "Select African country and currency",
  align = "right",
  className = "",
  triggerClassName = "",
  countries: allowedCountries,
}: CountryCurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const availableCountries = useMemo(
    () => (allowedCountries && allowedCountries.length > 0 ? allowedCountries : allCountries),
    [allowedCountries],
  );

  const orderedCountries = useMemo(() => {
    const rest = availableCountries.filter((item) => item !== "Nigeria");
    return availableCountries.includes("Nigeria") ? ["Nigeria", ...rest] : rest;
  }, [availableCountries]);

  const selectedCountry = allCountries.includes(country)
    ? country
    : availableCountries[0] || "Nigeria";
  const selectedCurrency = countryCurrencies[selectedCountry] || "NGN";
  const selectedFlag = countryFlag(selectedCountry);

  const options = useMemo(
    () =>
      orderedCountries.map((item) => {
        const code = countryCurrencies[item] || "NGN";
        return {
          value: item,
          label: item,
          badge: code,
          searchText: `${item} ${code}`,
          icon: <CountryFlag code={countryFlag(item)} country={item} />,
        };
      }),
    [orderedCountries],
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-transparent hover:bg-soft text-ink font-semibold text-xs sm:text-sm transition-colors cursor-pointer ${triggerClassName}`}
      >
        <CountryFlag code={selectedFlag} country={selectedCountry} />
        <span>{selectedCurrency}</span>
        <Icon
          name="chevron"
          size={14}
          className={`text-muted transition-transform ${open ? "-rotate-90" : "rotate-90"}`}
        />
      </button>

      <SelectDropdown
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        ariaLabel={ariaLabel}
        options={options}
        value={selectedCountry}
        onSelect={(nextCountry) => {
          const code = countryCurrencies[nextCountry] || "NGN";
          onChange(nextCountry, code);
        }}
        searchable
        searchPlaceholder="Search African country or code..."
        emptyMessage="No matching African countries."
        align={align}
        minWidth={270}
      />
    </div>
  );
}
