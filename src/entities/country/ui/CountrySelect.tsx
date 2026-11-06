import { useEffect, useRef, useState } from "react";
import { Icon } from "@/shared/ui";
import { countries, countryFlag } from "../model/country-data";
import { CountryFlag } from "./CountryFlag";

export interface CountrySelectProps {
  value: string;
  onChange: (country: string) => void;
  placeholder?: string;
  className?: string;
}

export function CountrySelect({
  value,
  onChange,
  placeholder = "Choose a country",
  className = "",
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const selectedCode = countryFlag(value);
  const filtered = countries.filter((country) =>
    country.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  return (
    <div className={`country-select relative ${className}`} ref={root}>
      <button
        type="button"
        className="country-select-trigger flex w-full h-10 items-center gap-2 px-3 border border-line rounded-[2px] bg-paper text-ink text-[11px] text-left hover:border-ink transition-colors"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {value ? (
          <CountryFlag code={selectedCode} country={value} />
        ) : (
          <span className="country-flag-empty w-4 h-3 bg-soft border border-line rounded-xs" />
        )}
        <strong className="flex-1 font-medium truncate">{value || placeholder}</strong>
        <Icon name="chevron" size={16} className={`text-muted transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div className="country-select-menu absolute z-50 top-[calc(100%+4px)] left-0 w-full min-w-[240px] max-h-[300px] overflow-hidden flex flex-col border border-line rounded-[4px] bg-paper shadow-card dark:shadow-card-dark text-ink animate-drawer-in">
          <div className="country-search flex items-center gap-2 p-2 border-b border-line bg-soft">
            <Icon name="search" size={15} className="text-muted shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search countries"
              className="w-full bg-transparent border-0 outline-none text-ink text-[11px] placeholder:text-subtle"
            />
          </div>
          <div className="country-options flex-1 overflow-y-auto p-1 divide-y divide-line/40" role="listbox">
            {filtered.map((country) => (
              <button
                type="button"
                role="option"
                aria-selected={value === country}
                key={country}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] hover:bg-soft transition-colors ${value === country ? "bg-soft font-bold text-ink" : "text-ink"}`}
                onClick={() => {
                  onChange(country);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <CountryFlag code={countryFlag(country)} country={country} />
                <span className="flex-1 truncate">{country}</span>
                {value === country && <Icon name="check" size={15} className="text-ink shrink-0" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="country-empty p-4 text-center text-muted text-[10px]">No matching countries.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

