import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/shared/ui";
import {
  countries,
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
}

export function CountryCurrencySelect({
  country,
  onChange,
  ariaLabel = "Select African country and currency",
  align = "right",
  className = "",
  triggerClassName = "",
}: CountryCurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);

  const orderedCountries = useMemo(() => {
    const rest = countries.filter((item) => item !== "Nigeria");
    return ["Nigeria", ...rest];
  }, []);

  const selectedCountry = countries.includes(country) ? country : "Nigeria";
  const selectedCurrency = countryCurrencies[selectedCountry] || "NGN";
  const selectedFlag = countryFlag(selectedCountry);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orderedCountries;
    return orderedCountries.filter((item) => {
      const code = (countryCurrencies[item] || "").toLowerCase();
      return item.toLowerCase().includes(q) || code.includes(q);
    });
  }, [orderedCountries, query]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={root}>
      <button
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

      {open && (
        <div
          className={`absolute z-50 top-[calc(100%+8px)] ${
            align === "left" ? "left-0" : "right-0"
          } w-[270px] sm:w-[290px] max-h-[300px] overflow-hidden flex flex-col border border-line rounded-xl bg-paper shadow-card dark:shadow-card-dark text-ink`}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-line bg-soft">
            <Icon name="search" size={14} className="text-muted shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search African country or code..."
              className="w-full bg-transparent border-0 outline-none text-ink text-xs placeholder:text-subtle"
            />
          </div>

          <div
            className="flex-1 overflow-y-auto p-1 divide-y divide-line/40"
            role="listbox"
            aria-label={ariaLabel}
          >
            {filtered.map((item) => {
              const code = countryCurrencies[item] || "NGN";
              const isSelected = item === selectedCountry;
              return (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(item, code);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-soft transition-colors cursor-pointer ${
                    isSelected ? "bg-soft font-semibold text-ink" : "text-ink"
                  }`}
                >
                  <CountryFlag code={countryFlag(item)} country={item} />
                  <span className="flex-1 truncate">{item}</span>
                  <span className="font-mono text-[11px] text-muted shrink-0">
                    {code}
                  </span>
                  {isSelected && (
                    <Icon name="check" size={14} className="text-ink shrink-0" />
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-4 text-center text-muted text-xs">
                No matching African countries.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

