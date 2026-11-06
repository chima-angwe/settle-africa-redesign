import { useState } from "react";

export function CountryFlag({ code, country }: { code: string; country: string }) {
  const [failed, setFailed] = useState(false);
  const flag = String.fromCodePoint(
    ...[...code.toUpperCase()].map((char) => 127397 + char.charCodeAt(0)),
  );
  return failed ? (
    <span
      className="rate-flag-fallback text-xs"
      role="img"
      aria-label={`${country} flag`}
    >
      {flag}
    </span>
  ) : (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={`${country} flag`}
      loading="lazy"
      className="inline-block w-4 h-3 object-cover rounded-xs"
      onError={() => setFailed(true)}
    />
  );
}

