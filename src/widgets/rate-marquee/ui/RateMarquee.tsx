import { useEffect, useState } from "react";
import { CountryFlag } from "@/entities/country";

export function RateMarquee() {
  const items = [
    { country: "Nigeria", countryCode: "ng", code: "NGN" },
    { country: "Ghana", countryCode: "gh", code: "GHS" },
    { country: "Kenya", countryCode: "ke", code: "KES" },
    { country: "Uganda", countryCode: "ug", code: "UGX" },
    { country: "Tanzania", countryCode: "tz", code: "TZS" },
    { country: "Rwanda", countryCode: "rw", code: "RWF" },
  ];
  const [rateData, setRateData] = useState<{
    date: string;
    rates: Record<string, number>;
  } | null>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("settle-demo-market-rates") || "null",
      );
    } catch {
      return null;
    }
  });
  const [loadingRates, setLoadingRates] = useState(true);
  useEffect(() => {
    let active = true;
    const loadRates = async () => {
      try {
        const response = await fetch(
          "https://api.frankfurter.dev/v2/rates?base=NGN&quotes=GHS,KES,UGX,TZS,RWF",
        );
        if (!response.ok) throw new Error("Rate request failed");
        const rows: { date: string; quote: string; rate: number }[] =
          await response.json();
        const result: { date: string; rates: Record<string, number> } = {
          date: rows[0]?.date ?? "",
          rates: Object.fromEntries(rows.map((row) => [row.quote, row.rate])),
        };
        if (!result.date || !Object.keys(result.rates).length)
          throw new Error("No rates returned");
        if (active) {
          setRateData(result);
          localStorage.setItem(
            "settle-demo-market-rates",
            JSON.stringify(result),
          );
        }
      } catch {
        // Keep the last successful daily reference rates visible when offline.
      } finally {
        if (active) setLoadingRates(false);
      }
    };
    loadRates();
    const refresh = window.setInterval(loadRates, 6 * 60 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, []);

  const dateLabel = rateData?.date
    ? new Date(`${rateData.date}T12:00:00`).toLocaleDateString("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const ticker = (copy = false) => (
    <div className="rate-marquee-group" aria-hidden={copy || undefined}>
      {items.map((item) => {
        const reciprocal =
          item.code === "NGN"
            ? 1
            : rateData?.rates[item.code]
              ? 1 / rateData.rates[item.code]
              : null;
        const value =
          reciprocal === null
            ? loadingRates
              ? "Loading rate…"
              : "Rate unavailable"
            : `₦${reciprocal.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        return (
          <div className="rate-tile" key={item.code}>
            <span className="rate-flag">
              <CountryFlag code={item.countryCode} country={item.country} />
            </span>
            <span className="rate-info">
              <strong>
                {item.country}
                <small> · {item.code}</small>
              </strong>
              <b>
                1 {item.code} = {value}
              </b>
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <section
      className="rate-banner"
      aria-label="Daily reference exchange rates against the Nigerian naira"
    >
      <div className="rate-banner-heading">
        <h2>
          Reference rates <span>· NGN</span>
        </h2>
        <span className="rate-demo-label">
          <i />{" "}
          {dateLabel
            ? `Frankfurter · ${dateLabel}`
            : loadingRates
              ? "Loading rates"
              : "Rates unavailable"}
        </span>
      </div>
      <div className="rate-marquee" tabIndex={0}>
        <div className="rate-marquee-track">
          {ticker()}
          {ticker(true)}
        </div>
      </div>
    </section>
  );
}

