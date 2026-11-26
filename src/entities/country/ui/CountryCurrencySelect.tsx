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
  currencyByCountry?: Record<string, string>;
  isoByCountry?: Record<string, string>;
}

export function CountryCurrencySelect({
  country,
  onChange,
  ariaLabel = "Select African country and currency",
  align = "right",
  className = "",
  triggerClassName = "",
  countries: allowedCountries,
  currencyByCountry,
  isoByCountry,
}: CountryCurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const hasCustomCountries = allowedCountries !== undefined;
  const availableCountries = useMemo(
    () => (hasCustomCountries ? allowedCountries : allCountries),
    [hasCustomCountries, allowedCountries],
  );

  const orderedCountries = useMemo(() => {
    const rest = availableCountries.filter((item) => item !== "Nigeria");
    return availableCountries.includes("Nigeria") ? ["Nigeria", ...rest] : rest;
  }, [availableCountries]);

  const resolveCurrency = (name: string) =>
    currencyByCountry?.[name] || (!hasCustomCountries ? countryCurrencies[name] : "") || "";
  const resolveFlag = (name: string) =>
    (isoByCountry?.[name] || countryFlag(name)).toLowerCase();

  const selectedCountry = availableCountries.includes(country)
    ? country
    : availableCountries[0] || "";
  const selectedCurrency = selectedCountry ? resolveCurrency(selectedCountry) : "---";
  const selectedFlag = selectedCountry ? resolveFlag(selectedCountry) : "";

  const options = useMemo(
    () =>
      orderedCountries.map((item) => {
        const code =
          currencyByCountry?.[item] || (!hasCustomCountries ? countryCurrencies[item] : "") || "";
        const flag = (isoByCountry?.[item] || countryFlag(item)).toLowerCase();
        return {
          value: item,
          label: item,
          badge: code,
          searchText: `${item} ${code}`,
          icon: <CountryFlag code={flag} country={item} />,
        };
      }),
    [orderedCountries, currencyByCountry, isoByCountry, hasCustomCountries],
  );

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={availableCountries.length === 0}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-transparent hover:bg-soft text-ink font-semibold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${triggerClassName}`}
      >
        {selectedFlag && selectedCountry ? (
          <CountryFlag code={selectedFlag} country={selectedCountry} />
        ) : null}
        <span>{selectedCurrency || "---"}</span>
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
          const code = resolveCurrency(nextCountry);
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
