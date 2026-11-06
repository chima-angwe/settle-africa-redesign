import { countryFlag } from "../model/country-data";
import { CountryFlag } from "./CountryFlag";

export function CountryBadge({ country }: { country: string }) {
  const code = countryFlag(country);
  return (
    <span className="country-badge inline-flex items-center gap-1.5 px-2 py-0.5 border border-line rounded bg-paper text-ink text-[11px] font-medium">
      {code && <CountryFlag code={code} country={country} />}
      <span>{country}</span>
    </span>
  );
}

