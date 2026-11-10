export interface OperatorLogoProps {
  operator: string;
  code?: string;
  size?: number;
}

export function OperatorLogo({ operator, code, size = 24 }: OperatorLogoProps) {
  const key = (code || operator).toLowerCase();

  // MTN
  if (key.includes("mtn")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="shrink-0 rounded-md"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="#FFCB05" />
        <ellipse
          cx="16"
          cy="16"
          rx="12"
          ry="7.5"
          fill="none"
          stroke="#111111"
          strokeWidth="1.5"
        />
        <text
          x="16"
          y="18.6"
          textAnchor="middle"
          fill="#111111"
          fontSize="7.5"
          fontWeight="800"
          fontFamily="Arial, sans-serif"
          letterSpacing="-0.3"
        >
          MTN
        </text>
      </svg>
    );
  }

  // Airtel
  if (key.includes("airtel")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="shrink-0 rounded-md"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="#E60000" />
        <path
          d="M21.5 21.8c-1.7.9-3.6 1.2-5.4.8-3-.6-5.2-3.2-5.1-6.2.1-3.3 2.8-6.2 6.3-6.4 2.6-.1 4.6 1.3 5 3.6.3 1.7-.7 3.2-2.2 3.5-1.1.2-2-.3-2.3-1.2-.2-.6 0-1.3.5-1.7.3-.2.4-.5.3-.8-.1-.5-.7-.8-1.4-.8-1.5.1-2.8 1.6-2.8 3.5 0 2.1 1.6 3.7 3.7 3.7 1.2 0 2.4-.5 3.3-1.3l.1 3.3Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // Etisalat / 9mobile
  if (key.includes("etisalat") || key.includes("9mobile")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="shrink-0 rounded-md"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="#007A33" />
        <path
          d="M16 6.5 22.8 13.3 16 20.1 9.2 13.3 16 6.5Zm0 3.3-3.5 3.5 3.5 3.5 3.5-3.5-3.5-3.5Z"
          fill="#FFFFFF"
        />
        <path
          d="M11.2 21.2c1.4 1.6 3.1 2.4 4.8 2.4 1.7 0 3.4-.8 4.8-2.4"
          fill="none"
          stroke="#9AE635"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Glo
  if (key.includes("glo")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="shrink-0 rounded-md"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="#00A859" />
        <text
          x="16"
          y="19.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10.5"
          fontWeight="800"
          fontFamily="Arial, sans-serif"
          letterSpacing="-0.5"
        >
          glo
        </text>
      </svg>
    );
  }

  // Safaricom
  if (key.includes("safaricom")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="shrink-0 rounded-md"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="#43B02A" />
        <circle cx="16" cy="16" r="6" fill="none" stroke="#FFFFFF" strokeWidth="2.2" />
        <path d="M16 7v4m0 10v4M7 16h4m10 0h4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  // Vodacom / Vodafone
  if (key.includes("voda")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="shrink-0 rounded-md"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="#E60000" />
        <circle cx="16" cy="16" r="8" fill="#FFFFFF" />
        <path
          d="M17.5 11.2c-2.6 0-4.4 2-4.4 4.7 0 2.3 1.7 4 3.8 4 1.8 0 3.2-1.3 3.2-3 0-1.5-1.1-2.6-2.5-2.6-.7 0-1.3.3-1.7.7.2-1.5 1-2.7 2.4-3.3l-.8-.5Z"
          fill="#E60000"
        />
      </svg>
    );
  }

  // Orange
  if (key.includes("orange")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="shrink-0 rounded-md"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="#FF7900" />
        <rect x="7" y="21" width="18" height="4" rx="1" fill="#FFFFFF" />
      </svg>
    );
  }

  // Telecel / Telkom / AT / Cell C / WE / Other
  const bg = key.includes("telecel") || key.includes("at")
    ? "#0066CC"
    : key.includes("telkom")
      ? "#005EB8"
      : key.includes("cell")
        ? "#111111"
        : key.includes("we")
          ? "#6D28D9"
          : "#374151";

  const label = operator
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className="shrink-0 rounded-md"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="7" fill={bg} />
      <text
        x="16"
        y="19.5"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="10"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}

