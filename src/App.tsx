import { useEffect, useRef, useState } from "react";
import "./V2.css";

type Page =
  | "Dashboard"
  | "Send money"
  | "Bulk transfer"
  | "Transactions"
  | "Track transaction"
  | "Recipients"
  | "Profile";
type AccountType = "individual" | "business";
type Recipient = {
  id: number;
  name: string;
  country: string;
  method: string;
  account: string;
  initials: string;
  provider?: string;
};
type Transfer = {
  id: string;
  name: string;
  country: string;
  amount: number;
  currency: string;
  status: "Pending" | "Completed" | "Processing";
  date: string;
  batchId?: string;
  provider?: string;
  method?: string;
  usdAmount?: number;
  recipientAmount?: number;
  recipientCurrency?: string;
  feeAmount?: number;
  feeCurrency?: string;
  exchangeRate?: number;
  description?: string;
};

const countries = [
  "Algeria",
  "Angola",
  "Benin",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cameroon",
  "Central African Republic",
  "Chad",
  "Comoros",
  "Congo",
  "Côte d’Ivoire",
  "Democratic Republic of the Congo",
  "Djibouti",
  "Egypt",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Ethiopia",
  "Gabon",
  "Gambia",
  "Ghana",
  "Guinea",
  "Guinea-Bissau",
  "Kenya",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Morocco",
  "Mozambique",
  "Namibia",
  "Niger",
  "Nigeria",
  "Rwanda",
  "São Tomé and Príncipe",
  "Senegal",
  "Seychelles",
  "Sierra Leone",
  "Somalia",
  "South Sudan",
  "Sudan",
  "Tanzania",
  "Togo",
  "Tunisia",
  "Uganda",
  "Zambia",
  "Zimbabwe",
];
const countryCodes: Record<string, string> = {
  Algeria: "DZ",
  Angola: "AO",
  Benin: "BJ",
  Botswana: "BW",
  "Burkina Faso": "BF",
  Burundi: "BI",
  "Cabo Verde": "CV",
  Cameroon: "CM",
  "Central African Republic": "CF",
  Chad: "TD",
  Comoros: "KM",
  Congo: "CG",
  "Côte d’Ivoire": "CI",
  "Democratic Republic of the Congo": "CD",
  Djibouti: "DJ",
  Egypt: "EG",
  "Equatorial Guinea": "GQ",
  Eritrea: "ER",
  Eswatini: "SZ",
  Ethiopia: "ET",
  Gabon: "GA",
  Gambia: "GM",
  Ghana: "GH",
  Guinea: "GN",
  "Guinea-Bissau": "GW",
  Kenya: "KE",
  Lesotho: "LS",
  Liberia: "LR",
  Libya: "LY",
  Madagascar: "MG",
  Malawi: "MW",
  Mali: "ML",
  Mauritania: "MR",
  Mauritius: "MU",
  Morocco: "MA",
  Mozambique: "MZ",
  Namibia: "NA",
  Niger: "NE",
  Nigeria: "NG",
  Rwanda: "RW",
  "São Tomé and Príncipe": "ST",
  Senegal: "SN",
  Seychelles: "SC",
  "Sierra Leone": "SL",
  Somalia: "SO",
  "South Sudan": "SS",
  Sudan: "SD",
  Tanzania: "TZ",
  Togo: "TG",
  Tunisia: "TN",
  Uganda: "UG",
  Zambia: "ZM",
  Zimbabwe: "ZW",
};
function countryFlag(country: string) {
  return countryCodes[country] || "";
}
const payoutOptions: Record<string, { banks: string[]; wallets: string[] }> = {
  Algeria: {
    banks: [
      "Banque Nationale d’Algérie",
      "Banque Extérieure d’Algérie",
      "Crédit Populaire d’Algérie",
    ],
    wallets: ["BaridiMob"],
  },
  Angola: {
    banks: [
      "Banco de Fomento Angola",
      "Banco Angolano de Investimentos",
      "Banco Millennium Atlântico",
    ],
    wallets: ["Unitel Money"],
  },
  Benin: {
    banks: ["Bank of Africa Benin", "Ecobank Benin", "Orabank Benin"],
    wallets: ["MTN MoMo", "Moov Money"],
  },
  Botswana: {
    banks: ["FNB Botswana", "Stanbic Bank Botswana", "Absa Bank Botswana"],
    wallets: ["Orange Money"],
  },
  "Burkina Faso": {
    banks: [
      "Coris Bank International",
      "Bank of Africa Burkina Faso",
      "Ecobank Burkina Faso",
    ],
    wallets: ["Orange Money", "Moov Money"],
  },
  Burundi: {
    banks: [
      "Banque de Crédit de Bujumbura",
      "Interbank Burundi",
      "CRDB Bank Burundi",
    ],
    wallets: ["Lumicash"],
  },
  "Cabo Verde": {
    banks: ["Caixa Económica de Cabo Verde", "Banco Comercial do Atlântico"],
    wallets: ["vinti4"],
  },
  Cameroon: {
    banks: [
      "Afriland First Bank",
      "Ecobank Cameroon",
      "Société Générale Cameroun",
    ],
    wallets: ["MTN MoMo", "Orange Money"],
  },
  "Central African Republic": {
    banks: ["Ecobank Central African Republic", "Commercial Bank Centrafrique"],
    wallets: ["Orange Money"],
  },
  Chad: {
    banks: ["Commercial Bank Tchad", "Ecobank Chad", "Orabank Chad"],
    wallets: ["Airtel Money"],
  },
  Comoros: {
    banks: ["Banque pour l’Industrie et le Commerce", "Exim Bank Comoros"],
    wallets: ["Huri Money"],
  },
  Congo: {
    banks: ["BGFI Bank Congo", "Ecobank Congo", "UBA Congo"],
    wallets: ["MTN MoMo", "Airtel Money"],
  },
  "Côte d’Ivoire": {
    banks: [
      "Société Générale Côte d’Ivoire",
      "Ecobank Côte d’Ivoire",
      "Bank of Africa Côte d’Ivoire",
    ],
    wallets: ["Orange Money", "MTN MoMo", "Wave"],
  },
  "Democratic Republic of the Congo": {
    banks: ["Rawbank", "Equity BCDC", "Trust Merchant Bank"],
    wallets: ["M-Pesa", "Orange Money", "Airtel Money"],
  },
  Djibouti: {
    banks: [
      "Banque pour le Commerce et l’Industrie - Mer Rouge",
      "CAC International Bank",
    ],
    wallets: ["D-Money"],
  },
  Egypt: {
    banks: [
      "National Bank of Egypt",
      "Banque Misr",
      "Commercial International Bank",
    ],
    wallets: ["Vodafone Cash", "Orange Cash", "e& Cash"],
  },
  "Equatorial Guinea": {
    banks: [
      "BGFI Bank Equatorial Guinea",
      "Société Générale de Banques en Guinée Équatoriale",
    ],
    wallets: ["Muni Dinero"],
  },
  Eritrea: {
    banks: [
      "Commercial Bank of Eritrea",
      "Housing and Commerce Bank of Eritrea",
    ],
    wallets: [],
  },
  Eswatini: {
    banks: ["Standard Bank Eswatini", "FNB Eswatini", "Nedbank Eswatini"],
    wallets: ["MTN MoMo"],
  },
  Ethiopia: {
    banks: ["Commercial Bank of Ethiopia", "Dashen Bank", "Awash Bank"],
    wallets: ["telebirr", "M-Pesa"],
  },
  Gabon: {
    banks: ["BGFI Bank Gabon", "UBA Gabon", "Ecobank Gabon"],
    wallets: ["Airtel Money"],
  },
  Gambia: {
    banks: ["Trust Bank Gambia", "Ecobank Gambia", "FBNBank Gambia"],
    wallets: ["QMoney", "Afrimoney"],
  },
  Ghana: {
    banks: [
      "GCB Bank",
      "Ecobank Ghana",
      "Absa Bank Ghana",
      "Fidelity Bank Ghana",
    ],
    wallets: ["MTN MoMo", "Telecel Cash", "AT Money"],
  },
  Guinea: {
    banks: [
      "Ecobank Guinea",
      "VistaGui",
      "Société Générale de Banques en Guinée",
    ],
    wallets: ["Orange Money"],
  },
  "Guinea-Bissau": {
    banks: ["Ecobank Guinea-Bissau", "Banco da África Ocidental"],
    wallets: ["Orange Money"],
  },
  Kenya: {
    banks: [
      "Equity Bank",
      "KCB Bank",
      "Co-operative Bank of Kenya",
      "NCBA Bank",
    ],
    wallets: ["M-Pesa", "Airtel Money"],
  },
  Lesotho: {
    banks: ["Standard Lesotho Bank", "FNB Lesotho", "Nedbank Lesotho"],
    wallets: ["EcoCash"],
  },
  Liberia: {
    banks: [
      "Access Bank Liberia",
      "Ecobank Liberia",
      "International Bank Liberia",
    ],
    wallets: ["Orange Money", "MTN MoMo"],
  },
  Libya: {
    banks: ["Jumhouria Bank", "Wahda Bank", "National Commercial Bank Libya"],
    wallets: [],
  },
  Madagascar: {
    banks: [
      "Bank of Africa Madagascar",
      "BNI Madagascar",
      "BFV-Société Générale",
    ],
    wallets: ["MVola", "Orange Money", "Airtel Money"],
  },
  Malawi: {
    banks: ["National Bank of Malawi", "NBS Bank", "Standard Bank Malawi"],
    wallets: ["Airtel Money", "TNM Mpamba"],
  },
  Mali: {
    banks: ["Bank of Africa Mali", "Ecobank Mali", "BMS-S.A."],
    wallets: ["Orange Money", "Moov Money"],
  },
  Mauritania: {
    banks: [
      "Banque Populaire de Mauritanie",
      "Société Générale Mauritanie",
      "Attijari Bank Mauritanie",
    ],
    wallets: ["Bankily"],
  },
  Mauritius: {
    banks: ["MauBank", "MCB", "Absa Bank Mauritius"],
    wallets: ["my.t money"],
  },
  Morocco: {
    banks: ["Attijariwafa bank", "Bank of Africa", "Banque Populaire"],
    wallets: ["inwi money", "Orange Money"],
  },
  Mozambique: {
    banks: ["Millennium bim", "BCI", "Standard Bank Mozambique"],
    wallets: ["M-Pesa", "e-Mola", "mKesh"],
  },
  Namibia: {
    banks: ["Bank Windhoek", "FNB Namibia", "Standard Bank Namibia"],
    wallets: ["eWallet"],
  },
  Niger: {
    banks: ["Bank of Africa Niger", "Ecobank Niger", "SONIBANK"],
    wallets: ["Airtel Money", "Moov Money"],
  },
  Nigeria: {
    banks: [
      "Access Bank",
      "GTBank",
      "First Bank of Nigeria",
      "United Bank for Africa",
      "Zenith Bank",
      "Fidelity Bank",
    ],
    wallets: ["OPay", "PalmPay", "Paga"],
  },
  Rwanda: {
    banks: ["Bank of Kigali", "I&M Bank Rwanda", "Equity Bank Rwanda"],
    wallets: ["MTN MoMo", "Airtel Money"],
  },
  "São Tomé and Príncipe": {
    banks: ["Banco Internacional de São Tomé e Príncipe", "Ecobank São Tomé"],
    wallets: ["Tlim"],
  },
  Senegal: {
    banks: ["CBAO", "Ecobank Senegal", "Société Générale Sénégal"],
    wallets: ["Wave", "Orange Money", "Free Money"],
  },
  Seychelles: {
    banks: ["Absa Bank Seychelles", "MCB Seychelles", "Nouvobanq"],
    wallets: ["Airtel Money"],
  },
  "Sierra Leone": {
    banks: [
      "Sierra Leone Commercial Bank",
      "Rokel Commercial Bank",
      "Ecobank Sierra Leone",
    ],
    wallets: ["Orange Money", "Afrimoney"],
  },
  Somalia: {
    banks: [
      "Premier Bank",
      "Dahabshil Bank International",
      "Salaam Somali Bank",
    ],
    wallets: ["EVC Plus", "Zaad"],
  },
  "South Sudan": {
    banks: [
      "Equity Bank South Sudan",
      "Nile Commercial Bank",
      "Commercial Bank of South Sudan",
    ],
    wallets: ["MTN MoMo"],
  },
  Sudan: {
    banks: [
      "Bank of Khartoum",
      "Omdurman National Bank",
      "Faisal Islamic Bank Sudan",
    ],
    wallets: ["Bankak"],
  },
  Tanzania: {
    banks: ["CRDB Bank", "NMB Bank", "NBC Tanzania"],
    wallets: ["M-Pesa", "Airtel Money", "Tigo Pesa"],
  },
  Togo: {
    banks: ["Ecobank Togo", "Orabank Togo", "Bank of Africa Togo"],
    wallets: ["T-Money", "Flooz"],
  },
  Tunisia: {
    banks: [
      "Banque Nationale Agricole",
      "Banque de Tunisie",
      "Attijari Bank Tunisia",
    ],
    wallets: ["D17"],
  },
  Uganda: {
    banks: ["Centenary Bank", "Stanbic Bank Uganda", "Absa Bank Uganda"],
    wallets: ["MTN MoMo", "Airtel Money"],
  },
  Zambia: {
    banks: ["Zanaco", "Absa Bank Zambia", "Stanbic Bank Zambia"],
    wallets: ["Airtel Money", "MTN MoMo", "Zamtel Kwacha"],
  },
  Zimbabwe: {
    banks: ["CBZ Bank", "Stanbic Bank Zimbabwe", "FBC Bank"],
    wallets: ["EcoCash", "OneMoney"],
  },
};
function payoutProviders(country: string, method: string) {
  const options = payoutOptions[country];
  return method === "Mobile money" || method === "M-Pesa"
    ? options?.wallets || []
    : options?.banks || [];
}
const callingCodes: Record<string, string> = {
  Algeria: "+213",
  Angola: "+244",
  Benin: "+229",
  Botswana: "+267",
  "Burkina Faso": "+226",
  Burundi: "+257",
  "Cabo Verde": "+238",
  Cameroon: "+237",
  "Central African Republic": "+236",
  Chad: "+235",
  Comoros: "+269",
  Congo: "+242",
  "Côte d’Ivoire": "+225",
  "Democratic Republic of the Congo": "+243",
  Djibouti: "+253",
  Egypt: "+20",
  "Equatorial Guinea": "+240",
  Eritrea: "+291",
  Eswatini: "+268",
  Ethiopia: "+251",
  Gabon: "+241",
  Gambia: "+220",
  Ghana: "+233",
  Guinea: "+224",
  "Guinea-Bissau": "+245",
  Kenya: "+254",
  Lesotho: "+266",
  Liberia: "+231",
  Libya: "+218",
  Madagascar: "+261",
  Malawi: "+265",
  Mali: "+223",
  Mauritania: "+222",
  Mauritius: "+230",
  Morocco: "+212",
  Mozambique: "+258",
  Namibia: "+264",
  Niger: "+227",
  Nigeria: "+234",
  Rwanda: "+250",
  "São Tomé and Príncipe": "+239",
  Senegal: "+221",
  Seychelles: "+248",
  "Sierra Leone": "+232",
  Somalia: "+252",
  "South Sudan": "+211",
  Sudan: "+249",
  Tanzania: "+255",
  Togo: "+228",
  Tunisia: "+216",
  Uganda: "+256",
  Zambia: "+260",
  Zimbabwe: "+263",
};
const initialRecipients: Recipient[] = [
  {
    id: 1,
    name: "Sarah Okafor",
    country: "Nigeria",
    method: "Bank transfer",
    account: "•••• 6789",
    initials: "SO",
    provider: "GTBank",
  },
  {
    id: 2,
    name: "David Kamau",
    country: "Kenya",
    method: "M-Pesa",
    account: "+254 ••• •• 456",
    initials: "DK",
    provider: "M-Pesa",
  },
  {
    id: 3,
    name: "Amara Boateng",
    country: "Ghana",
    method: "Mobile money",
    account: "•••• 3456",
    initials: "AB",
    provider: "MTN MoMo",
  },
];
const businessRecipients: Recipient[] = [
  {
    id: 11,
    name: "Nuru Office Supplies",
    country: "Kenya",
    method: "Bank transfer",
    account: "•••• 0912",
    initials: "NO",
    provider: "Equity Bank",
  },
  {
    id: 12,
    name: "Kora Logistics Ltd",
    country: "Ghana",
    method: "Bank transfer",
    account: "•••• 4421",
    initials: "KL",
    provider: "Ecobank Ghana",
  },
  {
    id: 13,
    name: "Amina Yusuf",
    country: "Nigeria",
    method: "Bank transfer",
    account: "•••• 8830",
    initials: "AY",
    provider: "Zenith Bank",
  },
];
const initialTransfers: Transfer[] = [
  {
    id: "ST-240918",
    name: "Sarah Okafor",
    country: "Nigeria",
    amount: 250,
    currency: "USD",
    status: "Completed",
    date: "Today, 10:42 AM",
  },
  {
    id: "ST-240905",
    name: "David Kamau",
    country: "Kenya",
    amount: 120,
    currency: "USD",
    status: "Processing",
    date: "Yesterday, 4:18 PM",
  },
  {
    id: "ST-240872",
    name: "Amara Boateng",
    country: "Ghana",
    amount: 80,
    currency: "USD",
    status: "Completed",
    date: "Oct 18, 2026",
  },
  {
    id: "ST-240841",
    name: "Sarah Okafor",
    country: "Nigeria",
    amount: 200,
    currency: "USD",
    status: "Pending",
    date: "Oct 16, 2026",
  },
];
const businessTransfers: Transfer[] = [
  {
    id: "BZ-1042",
    name: "Nuru Office Supplies",
    country: "Kenya",
    amount: 184,
    currency: "USD",
    status: "Processing",
    date: "Today, 9:15 AM",
  },
  {
    id: "BZ-1038",
    name: "Kora Logistics Ltd",
    country: "Ghana",
    amount: 95,
    currency: "USD",
    status: "Completed",
    date: "Yesterday, 2:40 PM",
  },
  {
    id: "BZ-1031",
    name: "Amina Yusuf",
    country: "Nigeria",
    amount: 320,
    currency: "USD",
    status: "Completed",
    date: "Oct 22, 2026",
  },
];

function Icon({ name, size = 19 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  const paths: Record<string, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    arrow: (
      <>
        <path d="M7 17 17 7M7 7h10v10" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5M12 15V3" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    close: (
      <>
        <path d="m18 6-12 12M6 6l12 12" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5M21 12H9" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="13" height="13" rx="2" />
        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    card: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M2 10h20" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    ),
    moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
    building: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3" />
      </>
    ),
    checkCircle: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    phone: (
      <>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.35 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.08 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.57 2.8.69a2 2 0 0 1 1.74 2.04Z" />
      </>
    ),
    upload: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m17 8-5-5-5 5M12 3v12" />
      </>
    ),
  };
  return <svg {...common}>{paths[name] ?? paths.grid}</svg>;
}

function LogoMark() {
  return (
    <span className="brand-symbol" aria-hidden="true">
      <img src="/settle-mark.png" alt="" />
    </span>
  );
}
function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: "light" | "dark";
  onToggle: () => void;
}) {
  return (
    <button
      className="icon-button theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <Icon name={theme === "light" ? "moon" : "sun"} size={17} />
    </button>
  );
}

function App() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [accountType, setAccountType] = useState<AccountType>(() =>
    localStorage.getItem("settle-demo-account-type") === "business"
      ? "business"
      : "individual",
  );
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [businessName, setBusinessName] = useState(
    () => localStorage.getItem("settle-demo-business-name") || "Chima Ventures",
  );
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    localStorage.getItem("settle-demo-theme") === "dark" ? "dark" : "light",
  );
  const [signedIn, setSignedIn] = useState(
    () => localStorage.getItem("settle-demo-user") === "true",
  );
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">(
    "signin",
  );
  const [name, setName] = useState(() => {
    const savedName = localStorage.getItem("settle-demo-name");
    if (!savedName || savedName === "Osunjimi Ibrahim") {
      localStorage.setItem("settle-demo-name", "Chima Angwe");
      return "Chima Angwe";
    }
    return savedName;
  });
  const [accountData, setAccountData] = useState<
    Record<AccountType, { recipients: Recipient[]; transfers: Transfer[] }>
  >(() => ({
    individual: {
      recipients:
        JSON.parse(
          localStorage.getItem("settle-demo-individual-recipients") ||
            localStorage.getItem("settle-demo-recipients") ||
            "null",
        ) || initialRecipients,
      transfers:
        JSON.parse(
          localStorage.getItem("settle-demo-individual-transfers") ||
            localStorage.getItem("settle-demo-transfers") ||
            "null",
        ) || initialTransfers,
    },
    business: {
      recipients:
        JSON.parse(
          localStorage.getItem("settle-demo-business-recipients") || "null",
        ) || businessRecipients,
      transfers:
        JSON.parse(
          localStorage.getItem("settle-demo-business-transfers") || "null",
        ) || businessTransfers,
    },
  }));
  const { recipients, transfers } = accountData[accountType];
  const setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>> = (
    action,
  ) =>
    setAccountData((current) => ({
      ...current,
      [accountType]: {
        ...current[accountType],
        recipients:
          typeof action === "function"
            ? action(current[accountType].recipients)
            : action,
      },
    }));
  const setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>> = (
    action,
  ) =>
    setAccountData((current) => ({
      ...current,
      [accountType]: {
        ...current[accountType],
        transfers:
          typeof action === "function"
            ? action(current[accountType].transfers)
            : action,
      },
    }));
  const [mobileNav, setMobileNav] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTransfer, setActiveTransfer] = useState<Transfer | null>(null);
  const [targetRecipientId, setTargetRecipientId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    localStorage.setItem(
      `settle-demo-${accountType}-recipients`,
      JSON.stringify(recipients),
    );
    if (accountType === "individual")
      localStorage.setItem(
        "settle-demo-recipients",
        JSON.stringify(recipients),
      );
  }, [accountType, recipients]);
  useEffect(() => {
    localStorage.setItem(
      `settle-demo-${accountType}-transfers`,
      JSON.stringify(transfers),
    );
    if (accountType === "individual")
      localStorage.setItem("settle-demo-transfers", JSON.stringify(transfers));
  }, [accountType, transfers]);
  useEffect(() => {
    if (signedIn) localStorage.setItem("settle-demo-user", "true");
    else localStorage.removeItem("settle-demo-user");
  }, [signedIn]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("settle-demo-theme", theme);
  }, [theme]);
  const toggleTheme = () =>
    setTheme((current) => (current === "light" ? "dark" : "light"));
  const switchAccount = (type: AccountType) => {
    setAccountType(type);
    localStorage.setItem("settle-demo-account-type", type);
    setAccountMenuOpen(false);
    setPage("Dashboard");
  };

  if (!signedIn)
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        theme={theme}
        onToggleTheme={toggleTheme}
        accountType={accountType}
        onAccountTypeChange={setAccountType}
        initialCountry={
          localStorage.getItem(`settle-demo-${accountType}-country`) ||
          "Nigeria"
        }
        onComplete={({
          accountType: selectedType,
          country,
          fullName,
          businessName: company,
          email,
          phone,
          dateOfBirth,
          address,
          occupation,
          businessCategory,
        }) => {
          setAccountType(selectedType);
          localStorage.setItem("settle-demo-account-type", selectedType);
          localStorage.setItem(`settle-demo-${selectedType}-country`, country);
          if (fullName) {
            setName(fullName);
            localStorage.setItem("settle-demo-name", fullName);
          }
          if (selectedType === "business" && company) {
            setBusinessName(company);
            localStorage.setItem("settle-demo-business-name", company);
          }
          if (email)
            localStorage.setItem(`settle-demo-${selectedType}-email`, email);
          if (phone)
            localStorage.setItem(`settle-demo-${selectedType}-phone`, phone);
          if (dateOfBirth)
            localStorage.setItem(
              `settle-demo-${selectedType}-dob`,
              dateOfBirth,
            );
          if (address)
            localStorage.setItem(
              `settle-demo-${selectedType}-address`,
              address,
            );
          if (occupation)
            localStorage.setItem(
              `settle-demo-${selectedType}-occupation`,
              occupation,
            );
          if (businessCategory)
            localStorage.setItem(
              "settle-demo-business-category",
              businessCategory,
            );
          if (authMode === "signup") {
            setAuthMode("signin");
            setSignedIn(false);
          } else {
            setSignedIn(true);
          }
        }}
      />
    );

  const navItems: { label: Page; icon: string }[] = [
    { label: "Dashboard", icon: "grid" },
    { label: "Send money", icon: "send" },
    ...(accountType === "business"
      ? [{ label: "Bulk transfer" as Page, icon: "upload" }]
      : []),
    { label: "Track transaction", icon: "search" },
    { label: "Transactions", icon: "clock" },
    { label: "Recipients", icon: "users" },
  ];
  const handleLogout = () => {
    setSignedIn(false);
    setAuthMode("signin");
  };
  return (
    <div className="portal">
      {mobileNav && (
        <button
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <button
          className="brand"
          onClick={() => {
            setPage("Dashboard");
            setMobileNav(false);
          }}
        >
          <LogoMark />
          <span className="brand-copy">
            <strong>Settle Africa</strong>
            <small>
              {accountType === "business" ? "BUSINESS" : "INDIVIDUAL"}
            </small>
          </span>
        </button>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${page === item.label ? "active" : ""}`}
              onClick={() => {
                if (item.label === "Send money") setTargetRecipientId(null);
                setPage(item.label);
                setMobileNav(false);
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "Track transaction" && <i className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="nav-caption">ACCOUNT</div>
          <button
            className={`nav-item ${page === "Profile" ? "active" : ""}`}
            onClick={() => {
              setPage("Profile");
              setMobileNav(false);
            }}
          >
            <Icon name="user" />
            <span>Profile & settings</span>
          </button>
          <div className="sidebar-help">
            <span className="help-mark">?</span>
            <span>
              <strong>Need a hand?</strong>
              <small>Our team is here to help</small>
            </span>
            <Icon name="chevron" size={16} />
          </div>
          <button className="nav-item logout" onClick={handleLogout}>
            <Icon name="logout" />
            <span>Sign out</span>
          </button>
        </div>
        <div className="sidebar-footnote">A clearer way to move money.</div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileNav((open) => !open)}
            aria-label={mobileNav ? "Close navigation" : "Open navigation"}
          >
            <Icon name={mobileNav ? "close" : "menu"} />
          </button>
          <div className="topbar-right">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button
              className="icon-button notification"
              aria-label="Notifications"
            >
              <Icon name="bell" />
              <i />
            </button>
            <div className="topbar-divider" />
            <div className="account-switcher">
              <button
                className="profile-chip"
                aria-expanded={accountMenuOpen}
                aria-haspopup="menu"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-label="Switch account"
              >
                <span className="profile-avatar-wrap">
                  <span className="avatar avatar-dark">
                    {accountType === "business"
                      ? businessName
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      : name
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                  </span>
                  <i className="profile-presence" />
                </span>
                <span className="profile-copy">
                  <strong className="profile-name">
                    {accountType === "business" ? businessName : name}
                  </strong>
                  <small>
                    {accountType === "business"
                      ? "BUSINESS ACCOUNT"
                      : "PERSONAL ACCOUNT"}
                  </small>
                </span>
                <span
                  className={`profile-open ${accountMenuOpen ? "open" : ""}`}
                >
                  <Icon name="chevron" size={15} />
                </span>
              </button>
              {accountMenuOpen && (
                <>
                  <button
                    className="account-menu-scrim"
                    aria-label="Close account switcher"
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <div
                    className="account-switch-menu"
                    role="menu"
                    aria-label="Switch account"
                  >
                    <div className="account-switch-title">
                      <strong>Switch account</strong>
                      <small>Your Settle profiles</small>
                    </div>
                    <button
                      role="menuitem"
                      className={`account-switch-option ${accountType === "individual" ? "selected" : ""}`}
                      onClick={() => switchAccount("individual")}
                    >
                      <span className="account-option-avatar">
                        {name
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                      <span>
                        <strong>{name}</strong>
                        <small>Individual account</small>
                      </span>
                      {accountType === "individual" && (
                        <Icon name="checkCircle" size={18} />
                      )}
                    </button>
                    <button
                      role="menuitem"
                      className={`account-switch-option ${accountType === "business" ? "selected" : ""}`}
                      onClick={() => switchAccount("business")}
                    >
                      <span className="account-option-avatar account-option-business">
                        <Icon name="building" size={18} />
                      </span>
                      <span>
                        <strong>{businessName}</strong>
                        <small>Business account · Demo</small>
                      </span>
                      {accountType === "business" && (
                        <Icon name="checkCircle" size={18} />
                      )}
                    </button>
                    <div className="account-switch-footnote">
                      Switching keeps your personal and business views separate.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <div className="page-content">
          {page === "Dashboard" &&
            (accountType === "business" ? (
              <BusinessDashboard
                businessName={businessName}
                transfers={transfers}
                setPage={(nextPage) => {
                  if (nextPage === "Send money") setTargetRecipientId(null);
                  setPage(nextPage);
                }}
                onSelectTransfer={setActiveTransfer}
              />
            ) : (
              <Dashboard
                name={name}
                transfers={transfers}
                setPage={(nextPage) => {
                  if (nextPage === "Send money") setTargetRecipientId(null);
                  setPage(nextPage);
                }}
                onSelectTransfer={setActiveTransfer}
              />
            ))}
          {page === "Send money" && (
            <SendMoney
              recipients={recipients}
              targetRecipientId={targetRecipientId}
              defaultCountry={
                localStorage.getItem(`settle-demo-${accountType}-country`) ||
                "Nigeria"
              }
              setTargetRecipientId={setTargetRecipientId}
              setRecipients={setRecipients}
              transfers={transfers}
              setTransfers={setTransfers}
              setPage={setPage}
            />
          )}
          {page === "Bulk transfer" && accountType === "business" && (
            <BulkTransfer
              setTransfers={setTransfers}
              onTrackTransfer={setActiveTransfer}
            />
          )}
          {page === "Recipients" && (
            <Recipients
              recipients={recipients}
              setRecipients={setRecipients}
              onSend={(id) => {
                setTargetRecipientId(id);
                setPage("Send money");
              }}
              query={query}
              setQuery={setQuery}
            />
          )}
          {page === "Transactions" && (
            <Transactions
              transfers={transfers}
              query={query}
              setQuery={setQuery}
              onSelectTransfer={setActiveTransfer}
            />
          )}
          {page === "Track transaction" && <Track transfers={transfers} />}
          {page === "Profile" && (
            <Profile
              name={accountType === "business" ? businessName : name}
              setName={
                accountType === "business"
                  ? (next) => {
                      setBusinessName(next);
                      localStorage.setItem("settle-demo-business-name", next);
                    }
                  : setName
              }
              onLogout={handleLogout}
              accountType={accountType}
            />
          )}
        </div>
        <footer className="page-footer">
          <span>© 2026 Settle Africa</span>
          <span>
            <i className="secure-dot" /> Your account is protected
          </span>
          <a href="#support">Help & support</a>
        </footer>
      </main>
      {activeTransfer && (
        <TransactionDetails
          transfer={activeTransfer}
          onClose={() => setActiveTransfer(null)}
        />
      )}
    </div>
  );
}

function AuthScreen({
  mode,
  setMode,
  theme,
  onToggleTheme,
  accountType,
  onAccountTypeChange,
  initialCountry,
  onComplete,
}: {
  mode: "signin" | "signup" | "forgot";
  setMode: (mode: "signin" | "signup" | "forgot") => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  accountType: AccountType;
  onAccountTypeChange: (type: AccountType) => void;
  initialCountry: string;
  onComplete: (account: {
    accountType: AccountType;
    country: string;
    fullName: string;
    businessName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    occupation: string;
    businessCategory: string;
  }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState("");
  const [country, setCountry] = useState(initialCountry);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState(1);
  const [otp, setOtp] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [occupation, setOccupation] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (mode === "forgot") {
      if (!email.trim()) {
        setError("Enter the email address linked to your account.");
        return;
      }
      setNotice(
        "If an account exists for that email, a reset link is on its way.",
      );
      return;
    }
    if (mode === "signup" && stage === 1) {
      if (accountType === "business" && !businessName.trim()) {
        setError("Enter your business name to continue.");
        return;
      }
      if (accountType === "business" && !businessRegistrationNumber.trim()) {
        setError("Enter your company registration number to continue.");
        return;
      }
      if (!fullName.trim() || !email.trim() || !phone.trim() || !country) {
        setError("Complete the required contact details.");
        return;
      }
      setNotice(`Demo verification code sent to ${phone}.`);
      setStage(2);
      return;
    }
    if (mode === "signup" && stage === 2) {
      if (otp !== "123456") {
        setError("That code did not match. Use 123456 for this prototype.");
        return;
      }
      setNotice("");
      setStage(3);
      return;
    }
    if (mode === "signup" && stage === 3) {
      if (
        !dateOfBirth ||
        (accountType === "business" ? !businessCategory : !occupation)
      ) {
        setError("Complete your profile details.");
        return;
      }
      setStage(4);
      return;
    }
    if (mode === "signup" && stage === 4) {
      if (!address.trim()) {
        setError("Enter your residential address to continue.");
        return;
      }
      setStage(5);
      return;
    }
    if (mode === "signup" && stage === 5) {
      if (password.length < 8) {
        setError("Create a password with at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Your passwords do not match.");
        return;
      }
    }
    if (
      mode === "signin" &&
      (!(accountType === "business" ? email.trim() : phone.trim()) ||
        !password.trim())
    ) {
      setError("Enter your sign-in details.");
      return;
    }
    onComplete({
      accountType,
      country,
      fullName:
        mode === "signup"
          ? fullName.trim()
          : accountType === "individual"
            ? localStorage.getItem("settle-demo-name") || "Chima Angwe"
            : "",
      businessName:
        mode === "signup"
          ? businessName.trim()
          : localStorage.getItem("settle-demo-business-name") ||
            "Chima Ventures",
      email: email.trim(),
      phone: phone.trim(),
      dateOfBirth,
      address: address.trim(),
      occupation,
      businessCategory,
    });
    if (mode === "signup") {
      setMode("signin");
      setNotice("Your account is ready. Sign in to continue.");
      setPassword("");
      setConfirmPassword("");
      setStage(1);
    }
  };
  const heading =
    mode === "signup"
      ? "Create your account"
      : mode === "forgot"
        ? "Reset your password"
        : "Welcome back";
  const changeAccountType = (nextType: AccountType) => {
    onAccountTypeChange(nextType);
    setCountry(
      localStorage.getItem(`settle-demo-${nextType}-country`) || "Nigeria",
    );
    setError("");
    setNotice("");
  };
  return (
    <div className={`auth-page ${mode === "signup" ? "auth-onboarding" : ""}`}>
      <div className="auth-decoration auth-orbit-one" />
      <div className="auth-decoration auth-orbit-two" />
      <div className="auth-top">
        <a className="brand auth-brand" href="#home">
          <LogoMark />
          <span className="brand-copy">
            <strong>Settle Africa</strong>
            <small>MOVE MONEY, WITH CLARITY</small>
          </span>
        </a>
        <div className="auth-top-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <div className="auth-top-note">
            <Icon name="shield" size={16} /> Secure, private transfers
          </div>
        </div>
      </div>
      <div
        className={`auth-layout ${mode === "signup" ? "auth-layout-signup" : ""}`}
      >
        <section className="auth-story">
          <span className="eyebrow">
            <i /> MONEY THAT MOVES WITH YOU
          </span>
          <h1>
            Across borders.
            <br />
            <em>Without the guesswork.</em>
          </h1>
          <div className="auth-story-points">
            <div>
              <span className="story-icon">
                <Icon name="eye" />
              </span>
              <span>
                <strong>Know before you send</strong>
                <small>See your rate and fees upfront.</small>
              </span>
            </div>
            <div>
              <span className="story-icon">
                <Icon name="search" />
              </span>
              <span>
                <strong>Follow every transfer</strong>
                <small>Track your money from send to receive.</small>
              </span>
            </div>
          </div>
          <div className="auth-route">
            <span className="route-circle">N</span>
            <div>
              <small>YOUR MONEY, ON ITS WAY</small>
              <div className="route-line">
                <b />
                <b />
                <b />
              </div>
              <strong>
                Nairobi <span>→</span> Lagos
              </strong>
            </div>
            <span className="route-circle route-end">L</span>
          </div>
        </section>
        <section
          className={`auth-card ${mode === "signup" ? `auth-card-signup signup-stage-${stage}` : ""}`}
        >
          <div className="auth-card-brand">
            <LogoMark />
            <span>SETTLE AFRICA</span>
          </div>
          <span className="auth-label">
            {mode === "forgot"
              ? "ACCOUNT ACCESS"
              : `${accountType === "business" ? "BUSINESS" : "INDIVIDUAL"} ACCOUNT`}
          </span>
          <h2>
            {mode === "signup" && stage > 1
              ? stage === 2
                ? "Verify your phone"
                : stage === 3
                  ? "Personal details"
                  : stage === 4
                    ? "Your address"
                    : "Secure your account"
              : heading}
          </h2>
          {(mode === "signin" || (mode === "signup" && stage === 1)) && (
            <div
              className="auth-account-switch"
              aria-label="Choose account type"
            >
              <button
                type="button"
                className={accountType === "individual" ? "selected" : ""}
                onClick={() => changeAccountType("individual")}
              >
                <Icon name="user" size={16} /> Individual
              </button>
              <button
                type="button"
                className={accountType === "business" ? "selected" : ""}
                onClick={() => changeAccountType("business")}
              >
                <Icon name="building" size={16} /> Business
              </button>
            </div>
          )}
          {mode === "signup" && (
            <div
              className="signup-progress"
              aria-label={`Signup step ${stage} of 5`}
            >
              {["Contact", "Verify", "Profile", "Address", "Password"].map(
                (label, index) => (
                  <div
                    className={
                      stage === index + 1
                        ? "active"
                        : stage > index + 1
                          ? "complete"
                          : ""
                    }
                    key={label}
                  >
                    <i>{stage > index + 1 ? "✓" : `0${index + 1}`}</i>
                    <span>{label}</span>
                  </div>
                ),
              )}
            </div>
          )}
          {notice && (
            <div className="notice success-notice">
              <Icon name="check" size={16} />
              {notice}
            </div>
          )}
          <form
            onSubmit={submit}
            className={`auth-form ${mode === "signup" ? "auth-signup-form" : ""}`}
          >
            {mode === "signup" && stage === 1 && (
              <>
                {accountType === "business" && (
                  <label>
                    Business name
                    <input
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Chima Ventures"
                      autoComplete="organization"
                    />
                  </label>
                )}
                {accountType === "business" && (
                  <label>
                    Company registration number
                    <input
                      required
                      value={businessRegistrationNumber}
                      onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
                      placeholder="e.g. RC 1234567"
                      autoComplete="off"
                    />
                  </label>
                )}
                <label>
                  {accountType === "business" ? "Your full name" : "Full name"}
                  <input
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Chima Angwe"
                    autoComplete="name"
                  />
                </label>
                <label>
                  Email address
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>
                <div className="auth-phone-country-field">
                  <label className="auth-phone-label">Phone number</label>
                  <div className="auth-phone-country-control">
                    <div className="auth-phone-country-select">
                      <CountrySelect value={country} onChange={setCountry} />
                    </div>
                    <div className="auth-phone-input-wrap">
                      <span>{callingCodes[country] || "+"}</span>
                      <input
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9 ]/g, ""))}
                        placeholder="801 234 5678"
                        autoComplete="tel-national"
                      />
                    </div>
                  </div>
                  <small className="auth-field-hint">Your country will be the default for transfers.</small>
                </div>
              </>
            )}
            {mode === "signup" && stage === 2 && (
              <div className="otp-panel">
                <span className="otp-icon">
                  <Icon name="phone" size={22} />
                </span>
                <p>
                  Enter the 6-digit code sent to <strong>{phone}</strong>.
                </p>
                <label>
                  Verification code
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                  />
                </label>
                <small>
                  Prototype code: <strong>123456</strong>
                </small>
                <button
                  type="button"
                  className="text-button otp-resend"
                  onClick={() =>
                    setNotice(`Demo code resent to ${phone}: 123456`)
                  }
                >
                  Resend code
                </button>
              </div>
            )}
            {mode === "signup" && stage === 3 && (
              <>
                <label>
                  Date of birth
                  <input
                    required
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </label>
                {accountType === "business" ? (
                  <label>
                    Business type
                    <select
                      required
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                    >
                      <option value="">Choose a category</option>
                      {[
                        "Retail and trade",
                        "Professional services",
                        "Technology",
                        "Logistics",
                        "Other",
                      ].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label>
                    Occupation
                    <select
                      required
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                    >
                      <option value="">Choose your occupation</option>
                      {[
                        "Salaried employee",
                        "Self-employed",
                        "Student",
                        "Other",
                      ].map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}
            {mode === "signup" && stage === 4 && (
              <>
                <label>
                  Residential address
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address and city"
                    autoComplete="street-address"
                  />
                </label>
                <div className="signup-country-summary">
                  <span className="signup-country-icon">
                    <Icon name="check" size={17} />
                  </span>
                  <span>
                    <strong>
                      <CountryBadge country={country} />
                    </strong>
                    <small>
                      Your selected country will be used as the default in
                      transfers.
                    </small>
                  </span>
                </div>
              </>
            )}
            {mode === "signup" && stage === 5 && (
              <>
                <label className="signup-password-field">
                  Create password
                  <div className="password-wrap">
                    <input
                      required
                      minLength={8}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      <Icon name="eye" size={17} />
                    </button>
                  </div>
                </label>
                <label className="signup-confirm-field">
                  Confirm password
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                </label>
              </>
            )}
            {(mode === "signin" || mode === "forgot") && (
              <>
                {mode === "forgot" || accountType === "business" ? (
                  <label>
                    Email address
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </label>
                ) : (
                  <label>
                    Phone number
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number"
                      autoComplete="tel"
                    />
                  </label>
                )}
                {mode === "signin" && (
                  <label>
                    Password
                    <div className="password-wrap">
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        <Icon name="eye" size={17} />
                      </button>
                    </div>
                  </label>
                )}
                {mode === "signin" && (
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => {
                      setError("");
                      setMode("forgot");
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </>
            )}
            {error && <div className="notice error-notice">{error}</div>}
            {mode === "signup" && stage > 1 && (
              <button
                type="button"
                className="button button-quiet auth-back"
                onClick={() => {
                  setError("");
                  setNotice("");
                  setStage(stage - 1);
                }}
              >
                ← Back
              </button>
            )}
            <button className="button button-primary auth-submit" type="submit">
              {mode === "signup"
                ? stage === 1
                  ? "Send verification code"
                  : stage === 2
                    ? "Verify phone number"
                    : stage === 5
                      ? "Create account"
                      : "Continue"
                : mode === "forgot"
                  ? "Send reset link"
                  : "Sign in"}
              <span>→</span>
            </button>
          </form>
          {mode !== "forgot" && (
            <div className="auth-switch">
              {mode === "signin" ? (
                <>
                  New to Settle?{" "}
                  <button
                    onClick={() => {
                      setError("");
                      setNotice("");
                      setStage(1);
                      setMode("signup");
                    }}
                  >
                    Create an account
                  </button>
                </>
              ) : stage === 1 ? (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setError("");
                      setNotice("");
                      setStage(1);
                      setMode("signin");
                    }}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setError("");
                    setNotice("");
                    setStage(1);
                    setMode("signin");
                  }}
                >
                  Return to sign in
                </button>
              )}
            </div>
          )}
          {mode === "forgot" && (
            <div className="auth-switch">
              <button
                onClick={() => {
                  setError("");
                  setNotice("");
                  setMode("signin");
                }}
              >
                Back to sign in
              </button>
            </div>
          )}
          {mode !== "signup" || stage === 5 ? (
            <div className="auth-legal">
              By continuing, you agree to our <a href="#terms">Terms</a> and{" "}
              <a href="#privacy">Privacy Policy</a>.
            </div>
          ) : null}
        </section>
      </div>
      <div className="auth-footer">
        <span>© 2026 Settle Africa</span>
        <span>
          <i className="secure-dot" /> Protected connection
        </span>
      </div>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading" data-section={eyebrow}>
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {subtitle?.trim() && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
function Dashboard({
  name,
  transfers,
  setPage,
  onSelectTransfer,
}: {
  name: string;
  transfers: Transfer[];
  setPage: (page: Page) => void;
  onSelectTransfer: (transfer: Transfer) => void;
}) {
  const firstName = name.split(" ")[0];
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <h1>Good morning, {firstName}</h1>
        </div>
      </div>
      <div className="stat-grid">
        <StatCard
          label="Transfer limit"
          value="₦1,000,000"
          note="Available this month"
          icon="card"
          tag="AVAILABLE"
        />
        <StatCard
          label="Sent this month"
          value="$450.00"
          note="Across 4 transfers"
          icon="send"
        />
        <StatCard
          label="In progress"
          value="1 transfer"
          note="Estimated arrival · Today"
          icon="clock"
        />
        <StatCard
          label="Account status"
          value="Unverified"
          note="Complete verification"
          icon="shield"
          tag="ACTION NEEDED"
        />
      </div>
      <section className="content-section dashboard-quick-section">
        <div className="section-heading">
          <div>
            <h2>Quick actions</h2>
          </div>
        </div>
        <div className="quick-grid">
          <QuickAction
            icon="send"
            title="Send money"
            note="Start a new transfer"
            onClick={() => setPage("Send money")}
          />
          <QuickAction
            icon="users"
            title="Recipients"
            note="Manage saved people"
            onClick={() => setPage("Recipients")}
          />
          <QuickAction
            icon="clock"
            title="Transactions"
            note="See your transfer history"
            onClick={() => setPage("Transactions")}
          />
          <QuickAction
            icon="search"
            title="Track a transfer"
            note="Follow a payment"
            onClick={() => setPage("Track transaction")}
          />
        </div>
      </section>
      <RateMarquee />
      <TransferCalculator onSend={() => setPage("Send money")} />
      <section className="content-section activity-section">
        <div className="section-heading">
          <div>
            <h2>Recent activity</h2>
            <p>Your latest money movements.</p>
          </div>
          <button
            className="link-button"
            onClick={() => setPage("Transactions")}
          >
            View all <span>→</span>
          </button>
        </div>
        <TransferTable
          transfers={transfers.slice(0, 3)}
          onSelect={onSelectTransfer}
        />
      </section>
    </>
  );
}
function BusinessDashboard({
  businessName,
  transfers,
  setPage,
  onSelectTransfer,
}: {
  businessName: string;
  transfers: Transfer[];
  setPage: (page: Page) => void;
  onSelectTransfer: (transfer: Transfer) => void;
}) {
  const [approved, setApproved] = useState<string[]>(() =>
    JSON.parse(localStorage.getItem("settle-demo-business-approved") || "[]"),
  );
  const requests = [
    {
      id: "AP-1042",
      payee: "Nuru Office Supplies",
      detail: "Kenya · Bank transfer",
      amount: "KES 184,000",
    },
    {
      id: "AP-1041",
      payee: "Kora Logistics Ltd",
      detail: "Ghana · Bank transfer",
      amount: "GHS 12,600",
    },
  ];
  const approve = (id: string) =>
    setApproved((current) => {
      const next = [...new Set([...current, id])];
      localStorage.setItem(
        "settle-demo-business-approved",
        JSON.stringify(next),
      );
      return next;
    });
  return (
    <>
      <div className="business-welcome">
        <div>
          <span className="eyebrow">
            <Icon name="building" size={14} /> BUSINESS WORKSPACE · DEMO
          </span>
          <h1>{businessName}</h1>
          <p>
            Payments, recipients and activity for your business in one place.
          </p>
        </div>
        <div className="business-welcome-actions">
          <button
            className="button button-secondary"
            onClick={() => setPage("Bulk transfer")}
          >
            <Icon name="upload" size={17} /> Bulk transfer
          </button>
          <button
            className="button button-primary"
            onClick={() => setPage("Send money")}
          >
            <Icon name="plus" size={17} /> New payment
          </button>
        </div>
      </div>
      <div className="business-demo-note">
        <span>
          <Icon name="shield" size={17} />
        </span>
        <div>
          <strong>Prototype workspace</strong>
          <small>
            Figures, approvals and payment activity shown here are sample data.
            No payments are sent.
          </small>
        </div>
      </div>
      <div className="stat-grid business-stat-grid">
        <StatCard
          label="Monthly transfer limit"
          value="₦25,000,000"
          note="Illustrative account limit"
          icon="card"
          tag="DEMO"
        />
        <StatCard
          label="Sent this month"
          value="₦4,280,000"
          note="Across 18 payments"
          icon="send"
        />
        <StatCard
          label="Needs approval"
          value={String(
            requests.filter((item) => !approved.includes(item.id)).length,
          )}
          note="Payments awaiting review"
          icon="clock"
          tag="REVIEW"
        />
        <StatCard
          label="Team members"
          value="4 members"
          note="Owner and 3 team members"
          icon="users"
        />
      </div>
      <section className="content-section dashboard-quick-section">
        <div className="section-heading">
          <div>
            <h2>Business actions</h2>
            <p>Common tasks for your team.</p>
          </div>
        </div>
        <div className="quick-grid">
          <QuickAction
            icon="send"
            title="New payment"
            note="Send to a business recipient"
            onClick={() => setPage("Send money")}
          />
          <QuickAction
            icon="upload"
            title="Bulk transfer"
            note="Pay several recipients at once"
            onClick={() => setPage("Bulk transfer")}
          />
          <QuickAction
            icon="users"
            title="Recipients"
            note="Manage saved payees"
            onClick={() => setPage("Recipients")}
          />
          <QuickAction
            icon="clock"
            title="Payment history"
            note="Review business transfers"
            onClick={() => setPage("Transactions")}
          />
          <QuickAction
            icon="search"
            title="Track a payment"
            note="Follow a transfer"
            onClick={() => setPage("Track transaction")}
          />
        </div>
      </section>
      <RateMarquee />
      <section className="content-section business-approvals">
        <div className="section-heading">
          <div>
            <h2>Payment approvals</h2>
            <p>Review outgoing payments before they are released.</p>
          </div>
          <span className="approval-count">
            {requests.filter((item) => !approved.includes(item.id)).length} to
            review
          </span>
        </div>
        <div className="approval-list">
          {requests.map((item) => (
            <article className="approval-row" key={item.id}>
              <span className="approval-avatar">
                <Icon name="building" size={18} />
              </span>
              <div className="approval-payee">
                <strong>{item.payee}</strong>
                <small>
                  {item.detail} · Ref {item.id}
                </small>
              </div>
              <strong className="approval-amount">{item.amount}</strong>
              {approved.includes(item.id) ? (
                <span className="approval-done">
                  <Icon name="checkCircle" size={16} /> Approved in demo
                </span>
              ) : (
                <button
                  className="button button-secondary button-small"
                  onClick={() => approve(item.id)}
                >
                  Approve demo
                </button>
              )}
            </article>
          ))}
        </div>
        <p className="prototype-caption">
          Approval actions update this local demo only. Team roles and payment
          release require backend support.
        </p>
      </section>
      <section className="content-section activity-section">
        <div className="section-heading">
          <div>
            <h2>Recent business payments</h2>
            <p>Latest payment activity for this demo account.</p>
          </div>
          <button
            className="link-button"
            onClick={() => setPage("Transactions")}
          >
            View all <span>→</span>
          </button>
        </div>
        <TransferTable
          transfers={transfers.slice(0, 3)}
          onSelect={onSelectTransfer}
        />
      </section>
    </>
  );
}
type BulkDraft = {
  key: string;
  name: string;
  country: string;
  account: string;
  amount: string;
};
function parseCsvLine(line: string) {
  const cells: string[] = [];
  let cell = "",
    quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) {
      cell += '"';
      index++;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else cell += char;
  }
  cells.push(cell.trim());
  return cells;
}
function BulkTransfer({
  setTransfers,
  onTrackTransfer,
}: {
  setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
  onTrackTransfer: (transfer: Transfer) => void;
}) {
  const [rows, setRows] = useState<BulkDraft[]>([]);
  const [submitted, setSubmitted] = useState<Transfer[]>([]);
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState("");
  const rowError = (row: BulkDraft) =>
    !row.name.trim()
      ? "Add a recipient name"
      : !countryCodes[row.country]
        ? "Choose a supported country"
        : !row.account.trim()
          ? "Add bank or wallet details"
          : !Number.isFinite(Number(row.amount)) || Number(row.amount) <= 0
            ? "Enter an amount above zero"
            : "";
  const validRows = rows.filter((row) => !rowError(row));
  const total = validRows.reduce((sum, row) => sum + Number(row.amount), 0);
  const update = (
    key: string,
    field: keyof Omit<BulkDraft, "key">,
    value: string,
  ) =>
    setRows((current) =>
      current.map((row) =>
        row.key === key ? { ...row, [field]: value } : row,
      ),
    );
  const addRow = (row: Partial<BulkDraft> = {}) =>
    setRows((current) => [
      ...current,
      {
        key: String(Date.now()) + Math.random(),
        name: row.name || "",
        country: row.country || "",
        account: row.account || "",
        amount: row.amount || "",
      },
    ]);
  const importCsv = async (file?: File) => {
    if (!file) return;
    setError("");
    try {
      const lines = (await file.text())
        .split(/\r?\n/)
        .filter((line) => line.trim());
      if (lines.length < 2)
        throw new Error("The CSV needs a header row and at least one payment.");
      const headers = parseCsvLine(lines[0]).map((value) =>
        value.toLowerCase(),
      );
      const find = (...names: string[]) =>
        headers.findIndex((header) => names.includes(header));
      const nameIndex = find(
        "recipient",
        "recipient name",
        "name",
        "beneficiary",
      );
      const countryIndex = find("country", "destination country");
      const accountIndex = find(
        "account",
        "account number",
        "phone",
        "mobile number",
        "bank or wallet",
      );
      const amountIndex = find("amount", "amount usd", "usd amount");
      if (
        [nameIndex, countryIndex, accountIndex, amountIndex].some(
          (index) => index < 0,
        )
      )
        throw new Error(
          "Include these CSV columns: Recipient, Country, Account, Amount.",
        );
      const imported = lines.slice(1).map((line) => {
        const cells = parseCsvLine(line);
        const rawCountry = cells[countryIndex] || "";
        const country =
          countries.find(
            (item) => item.toLowerCase() === rawCountry.toLowerCase(),
          ) ||
          countries.find(
            (item) =>
              countryCodes[item]?.toLowerCase() === rawCountry.toLowerCase(),
          ) ||
          rawCountry;
        return {
          key: String(Date.now()) + Math.random(),
          name: cells[nameIndex] || "",
          country,
          account: cells[accountIndex] || "",
          amount: cells[amountIndex] || "",
        };
      });
      setRows(imported);
      setSubmitted([]);
      setError(
        String(imported.length) +
          " payment rows imported. Review the details before creating the batch.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "We could not read that CSV file.",
      );
    }
  };
  const loadSample = () => {
    setRows([
      {
        key: "sample-1",
        name: "Nuru Office Supplies",
        country: "Kenya",
        account: "•••• 0912",
        amount: "184",
      },
      {
        key: "sample-2",
        name: "Kora Logistics Ltd",
        country: "Ghana",
        account: "•••• 4421",
        amount: "95",
      },
      {
        key: "sample-3",
        name: "Amina Yusuf",
        country: "Nigeria",
        account: "•••• 8830",
        amount: "320",
      },
    ]);
    setSubmitted([]);
    setError("Sample payments loaded. Review and create this demo batch.");
  };
  const downloadTemplate = () => {
    const csv =
      "Recipient,Country,Account,Amount\nSample Supplier,Kenya,123456789,150.00";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "settle-bulk-transfer-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const createBatch = () => {
    if (rows.length === 0) {
      setError("Add payments or import a CSV file first.");
      return;
    }
    const invalid = rows.find((row) => rowError(row));
    if (invalid) {
      setError(
        (invalid.name || "A payment row") + ": " + rowError(invalid) + ".",
      );
      return;
    }
    const now = Date.now(),
      id = "BT-" + String(now).slice(-7);
    const created = rows.map(
      (row, index): Transfer => ({
        id:
          "BP-" +
          String(now).slice(-6) +
          "-" +
          String(index + 1).padStart(2, "0"),
        batchId: id,
        name: row.name.trim(),
        country: row.country,
        amount: Number(row.amount),
        currency: "USD",
        status: "Processing",
        date: "Just now",
      }),
    );
    setTransfers((current) => [...created, ...current]);
    setBatchId(id);
    setSubmitted(created);
    setError("");
  };
  if (submitted.length)
    return (
      <>
        <PageHeading
          eyebrow="BUSINESS PAYMENTS"
          title="Batch created"
          subtitle={
            batchId +
            " · " +
            submitted.length +
            " payments are now in your payment history."
          }
          action={
            <button
              className="button button-secondary"
              onClick={() => {
                setRows([]);
                setSubmitted([]);
                setBatchId("");
              }}
            >
              Create another batch
            </button>
          }
        />
        <div className="bulk-confirmation">
          <span className="bulk-success-icon">
            <Icon name="checkCircle" size={25} />
          </span>
          <div>
            <h2>Your payment batch is ready</h2>
            <p>
              Each payment has its own reference, so you can follow its status
              separately.
            </p>
          </div>
          <div className="bulk-confirmation-total">
            <small>BATCH TOTAL</small>
            <strong>
              USD{" "}
              {submitted
                .reduce((sum, transfer) => sum + transfer.amount, 0)
                .toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
        <section className="content-section bulk-results">
          <div className="section-heading">
            <div>
              <h2>Payments in this batch</h2>
              <p>Open a payment to see its reference and current status.</p>
            </div>
          </div>
          {submitted.map((transfer) => (
            <article className="bulk-result-row" key={transfer.id}>
              <CountryBadge country={transfer.country} />
              <div className="bulk-result-payee">
                <strong>{transfer.name}</strong>
                <small>
                  {transfer.id} · {transfer.batchId}
                </small>
              </div>
              <strong className="bulk-result-amount">
                USD {transfer.amount.toFixed(2)}
              </strong>
              <span className="status status-processing">
                <i />
                Processing
              </span>
              <button
                className="button button-secondary button-small"
                onClick={() => onTrackTransfer(transfer)}
              >
                Track payment
              </button>
            </article>
          ))}
        </section>
        <p className="prototype-caption">
          Demo payment references are also available in Track transaction and
          Transactions.
        </p>
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow="BUSINESS PAYMENTS"
        title="Bulk transfer"
        subtitle="Prepare payments together, then track each one by reference."
        action={
          <button
            className="button button-secondary"
            onClick={downloadTemplate}
          >
            <Icon name="download" size={16} /> CSV template
          </button>
        }
      />
      <section className="bulk-import-panel">
        <div className="bulk-import-icon">
          <Icon name="upload" size={22} />
        </div>
        <div className="bulk-import-copy">
          <h2>Start with a payment list</h2>
          <p>
            Upload a CSV with recipient, country, account and amount columns.
            You can review and edit each payment before creating the batch.
          </p>
        </div>
        <label className="button button-primary bulk-file-button">
          <Icon name="upload" size={16} /> Choose CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              void importCsv(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </section>
      <div className="bulk-demo-actions">
        <span>Or start with sample data</span>
        <button className="link-button" onClick={loadSample}>
          Load sample payments <span>→</span>
        </button>
      </div>
      {error && (
        <div
          className={
            "notice " +
            (error.includes("imported") || error.includes("Sample")
              ? "success-notice"
              : "error-notice")
          }
        >
          {error}
        </div>
      )}
      <section className="content-section bulk-editor">
        <div className="section-heading">
          <div>
            <h2>Review payments</h2>
            <p>
              {rows.length} {rows.length === 1 ? "payment" : "payments"} added
            </p>
          </div>
          <button
            className="button button-secondary button-small"
            onClick={() => addRow()}
          >
            <Icon name="plus" size={15} /> Add payment
          </button>
        </div>
        {rows.length === 0 ? (
          <div className="bulk-empty">
            <span className="bulk-empty-mark">
              <Icon name="upload" size={19} />
            </span>
            <strong>Your payment list will appear here</strong>
            <span>Upload a CSV or add recipients one at a time.</span>
          </div>
        ) : (
          <div className="bulk-rows">
            <div className="bulk-row bulk-row-heading">
              <span />
              <span>RECIPIENT</span>
              <span>COUNTRY</span>
              <span>ACCOUNT / PHONE</span>
              <span>AMOUNT · USD</span>
              <span />
            </div>
            {rows.map((row, index) => (
              <div className="bulk-row" key={row.key}>
                <span className="bulk-row-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <input
                  aria-label={"Recipient " + (index + 1)}
                  value={row.name}
                  onChange={(event) =>
                    update(row.key, "name", event.target.value)
                  }
                  placeholder="Recipient name"
                />
                <CountrySelect
                  value={row.country}
                  onChange={(country) => update(row.key, "country", country)}
                />
                <input
                  aria-label={"Account " + (index + 1)}
                  value={row.account}
                  onChange={(event) =>
                    update(row.key, "account", event.target.value)
                  }
                  placeholder="Account or phone"
                />
                <input
                  aria-label={"Amount " + (index + 1)}
                  type="number"
                  min="0.01"
                  value={row.amount}
                  onChange={(event) =>
                    update(row.key, "amount", event.target.value)
                  }
                  placeholder="0.00"
                />
                <button
                  className="icon-button bulk-remove"
                  aria-label={"Remove payment " + (index + 1)}
                  onClick={() =>
                    setRows((current) =>
                      current.filter((item) => item.key !== row.key),
                    )
                  }
                >
                  <Icon name="close" size={16} />
                </button>
                {rowError(row) && (
                  <small className="bulk-row-error">{rowError(row)}</small>
                )}
              </div>
            ))}
          </div>
        )}
        {rows.length > 0 && (
          <footer className="bulk-editor-footer">
            <div>
              <span>{validRows.length} ready</span>
              <strong>
                Batch total · USD{" "}
                {total.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>
            <button
              className="button button-primary"
              onClick={createBatch}
              disabled={validRows.length !== rows.length}
            >
              Create demo batch <span>→</span>
            </button>
          </footer>
        )}
        <p className="prototype-caption">
          Prototype only. Creating a batch records simulated payments in this
          business account; no funds are sent.
        </p>
      </section>
    </>
  );
}
function TransferCalculator({ onSend }: { onSend: () => void }) {
  const currencies = [
    { code: "USD", flag: "🇺🇸", country: "United States", ngn: 1550 },
    { code: "NGN", flag: "🇳🇬", country: "Nigeria", ngn: 1 },
    { code: "KES", flag: "🇰🇪", country: "Kenya", ngn: 11.4 },
    { code: "GHS", flag: "🇬🇭", country: "Ghana", ngn: 104 },
    { code: "UGX", flag: "🇺🇬", country: "Uganda", ngn: 0.41 },
  ];
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("NGN");
  const sender = currencies.find((item) => item.code === from) || currencies[0];
  const receiver = currencies.find((item) => item.code === to) || currencies[1];
  const rate = sender.ngn / receiver.ngn;
  const converted = (Number(amount) || 0) * rate;
  const format = (value: number) =>
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return (
    <section className="content-section calculator-section">
      <div className="section-heading">
        <div>
          <h2>Transfer calculator</h2>
          <p>Get an estimate before you send.</p>
        </div>
        <span className="calculator-demo">
          <i /> DEMO RATE
        </span>
      </div>
      <div className="calculator-card">
        <div className="calculator-chart">
          <div className="calculator-rate">
            1 {from} <span>=</span> {format(rate)} {to}
          </div>
          <div className="chart-area">
            <svg
              viewBox="0 0 520 190"
              role="img"
              aria-label="Illustrative exchange rate chart"
            >
              <path
                className="chart-gridline"
                d="M0 35H520M0 95H520M0 155H520"
              />
              <path
                className="chart-line"
                d="M4 113 42 51 76 63 112 137 151 126 190 45 228 71 265 80 305 98 345 72 381 109 420 150 458 130 495 158 516 137"
              />
              <circle className="chart-point" cx="516" cy="137" r="5" />
            </svg>
            <div className="chart-dates">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
        <div className="calculator-controls">
          <label className="calculator-field">
            <span>You send</span>
            <div>
              <input
                aria-label="Amount to send"
                type="number"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              <span className="currency-choice">
                <CountryFlag
                  code={
                    from === "USD"
                      ? "us"
                      : from === "NGN"
                        ? "ng"
                        : from === "KES"
                          ? "ke"
                          : from === "GHS"
                            ? "gh"
                            : "ug"
                  }
                  country={
                    currencies.find((item) => item.code === from)?.country ||
                    from
                  }
                />
                <select
                  aria-label="Sending currency"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                >
                  {currencies.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code}
                    </option>
                  ))}
                </select>
              </span>
            </div>
          </label>
          <button
            className="calculator-swap"
            aria-label="Swap currencies"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
          >
            ↕
          </button>
          <label className="calculator-field">
            <span>Recipient gets</span>
            <div>
              <output>{format(converted)}</output>
              <span className="currency-choice">
                <CountryFlag
                  code={
                    to === "USD"
                      ? "us"
                      : to === "NGN"
                        ? "ng"
                        : to === "KES"
                          ? "ke"
                          : to === "GHS"
                            ? "gh"
                            : "ug"
                  }
                  country={
                    currencies.find((item) => item.code === to)?.country || to
                  }
                />
                <select
                  aria-label="Receiving currency"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                >
                  {currencies.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.code}
                    </option>
                  ))}
                </select>
              </span>
            </div>
          </label>
          <div className="calculator-meta">
            <div>
              <span>Transfer fee</span>
              <strong>{from} 2.99</strong>
            </div>
            <div>
              <span>Estimated arrival</span>
              <strong>Minutes</strong>
            </div>
          </div>
          <button className="button calculator-send" onClick={onSend}>
            Send money <span>→</span>
          </button>
          <small className="calculator-disclaimer">
            Illustrative rates only. Final rates and fees may vary.
          </small>
        </div>
      </div>
    </section>
  );
}
function RateMarquee() {
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
function CountryFlag({ code, country }: { code: string; country: string }) {
  const [failed, setFailed] = useState(false);
  const flag = String.fromCodePoint(
    ...[...code.toUpperCase()].map((char) => 127397 + char.charCodeAt(0)),
  );
  return failed ? (
    <span
      className="rate-flag-fallback"
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
      onError={() => setFailed(true)}
    />
  );
}
function CountrySelect({
  value,
  onChange,
  placeholder = "Choose a country",
}: {
  value: string;
  onChange: (country: string) => void;
  placeholder?: string;
}) {
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
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);
  return (
    <div className="country-select" ref={root}>
      <button
        type="button"
        className="country-select-trigger"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {value ? (
          <CountryFlag code={selectedCode} country={value} />
        ) : (
          <span className="country-flag-empty" />
        )}
        <strong>{value || placeholder}</strong>
        <Icon name="chevron" size={16} />
      </button>
      {open && (
        <div className="country-select-menu">
          <div className="country-search">
            <Icon name="search" size={16} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search countries"
            />
          </div>
          <div className="country-options" role="listbox">
            {filtered.map((country) => (
              <button
                type="button"
                role="option"
                aria-selected={value === country}
                key={country}
                onClick={() => {
                  onChange(country);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <CountryFlag code={countryFlag(country)} country={country} />
                <span>{country}</span>
                {value === country && <Icon name="check" size={15} />}
              </button>
            ))}
            {filtered.length === 0 && (
              <span className="country-empty">No matching countries.</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
function CountryBadge({ country }: { country: string }) {
  const code = countryFlag(country);
  return (
    <span className="country-badge">
      {code && <CountryFlag code={code} country={country} />}
      <span>{country}</span>
    </span>
  );
}
function StatCard({
  label,
  value,
  note,
  icon,
  tag,
}: {
  label: string;
  value: string;
  note: string;
  icon: string;
  tag?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-icon">
          <Icon name={icon} />
        </span>
        {tag && (
          <span
            className={`stat-tag ${tag === "ACTION NEEDED" ? "tag-warn" : ""}`}
          >
            {tag}
          </span>
        )}
      </div>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-note">{note}</span>
    </div>
  );
}
function QuickAction({
  icon,
  title,
  note,
  onClick,
}: {
  icon: string;
  title: string;
  note: string;
  onClick: () => void;
}) {
  return (
    <button className="quick-card" onClick={onClick}>
      <span className="quick-icon">
        <Icon name={icon} />
      </span>
      <span>
        <strong>{title}</strong>
        <small>{note}</small>
      </span>
      <Icon name="chevron" size={17} />
    </button>
  );
}

function SendMoney({
  recipients,
  targetRecipientId,
  defaultCountry,
  setTargetRecipientId,
  setRecipients,
  transfers,
  setTransfers,
  setPage,
}: {
  recipients: Recipient[];
  targetRecipientId: number | null;
  defaultCountry: string;
  setTargetRecipientId: (id: number | null) => void;
  setRecipients: (items: Recipient[]) => void;
  transfers: Transfer[];
  setTransfers: (items: Transfer[]) => void;
  setPage: (page: Page) => void;
}) {
  const targetRecipient = recipients.find(
    (item) => item.id === targetRecipientId,
  );
  const [step, setStep] = useState(targetRecipient ? 2 : 1);
  const [country, setCountry] = useState(
    targetRecipient?.country || defaultCountry,
  );
  const [recipientId, setRecipientId] = useState(
    targetRecipient ? String(targetRecipient.id) : "",
  );
  const [recipientSearch, setRecipientSearch] = useState("");
  const [addingRecipient, setAddingRecipient] = useState(false);
  const [newName, setNewName] = useState(targetRecipient?.name || "");
  const [newAccount, setNewAccount] = useState(targetRecipient?.account || "");
  const [amount, setAmount] = useState("");
  const [sendCurrency, setSendCurrency] = useState("USD");
  const [method, setMethod] = useState(
    targetRecipient?.method || "Bank transfer",
  );
  const [provider, setProvider] = useState(
    targetRecipient?.provider ||
      payoutProviders(
        targetRecipient?.country || defaultCountry,
        targetRecipient?.method || "Bank transfer",
      )[0] ||
      "",
  );
  const [receiverType, setReceiverType] = useState("Personal");
  const [asset, setAsset] = useState("USDC");
  const [description, setDescription] = useState("");
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const selected = recipients.find((item) => String(item.id) === recipientId);
  const receiveCurrencyByCountry: Record<string, string> = {
    Algeria: "DZD",
    Angola: "AOA",
    Benin: "XOF",
    Botswana: "BWP",
    "Burkina Faso": "XOF",
    Burundi: "BIF",
    "Cabo Verde": "CVE",
    Cameroon: "XAF",
    "Central African Republic": "XAF",
    Chad: "XAF",
    Comoros: "KMF",
    Congo: "XAF",
    "Côte d’Ivoire": "XOF",
    "Democratic Republic of the Congo": "CDF",
    Djibouti: "DJF",
    Egypt: "EGP",
    "Equatorial Guinea": "XAF",
    Eritrea: "ERN",
    Eswatini: "SZL",
    Ethiopia: "ETB",
    Gabon: "XAF",
    Gambia: "GMD",
    Ghana: "GHS",
    Guinea: "GNF",
    "Guinea-Bissau": "XOF",
    Kenya: "KES",
    Lesotho: "LSL",
    Liberia: "LRD",
    Libya: "LYD",
    Madagascar: "MGA",
    Malawi: "MWK",
    Mali: "XOF",
    Mauritania: "MRU",
    Mauritius: "MUR",
    Morocco: "MAD",
    Mozambique: "MZN",
    Namibia: "NAD",
    Niger: "XOF",
    Nigeria: "NGN",
    Rwanda: "RWF",
    "São Tomé and Príncipe": "STN",
    Senegal: "XOF",
    Seychelles: "SCR",
    "Sierra Leone": "SLE",
    Somalia: "SOS",
    "South Sudan": "SSP",
    Sudan: "SDG",
    Tanzania: "TZS",
    Togo: "XOF",
    Tunisia: "TND",
    Uganda: "UGX",
    Zambia: "ZMW",
    Zimbabwe: "USD",
    "South Africa": "ZAR",
  };
  const destinationCurrency = receiveCurrencyByCountry[country] || "XOF";
  const receiveRates: Record<string, number> = {
    NGN: 1550,
    KES: 129,
    GHS: 15.2,
    UGX: 3720,
    TZS: 2670,
    RWF: 1370,
    EGP: 48.5,
    ZAR: 18.2,
    XOF: 610,
    XAF: 610,
  };
  const sourceUsdRates: Record<string, number> = {
    USD: 1,
    GBP: 1.27,
    EUR: 1.08,
    NGN: 1 / 1550,
  };
  const sourceCurrencyFlags: Record<string, string> = {
    USD: "us",
    GBP: "gb",
    EUR: "eu",
    NGN: "ng",
  };
  const sourceUsdRate = sourceUsdRates[sendCurrency] || 1;
  const usdAmount = Number(amount || 0) * sourceUsdRate;
  const feeUsd = 2.99;
  const feeAmount = feeUsd / sourceUsdRate;
  const amountToConvert = Math.max(0, usdAmount - feeUsd);
  const receiveRate = receiveRates[destinationCurrency];
  const recipientAmount = receiveRate ? amountToConvert * receiveRate : 0;
  const exchangeRate = receiveRate ? sourceUsdRate * receiveRate : 0;
  const accountDigits = newAccount.replace(/\D/g, "");
  const lookupReady =
    method === "Stablecoin"
      ? newAccount.trim().length >= 12
      : method === "Recipient tag"
        ? newAccount.trim().length >= 4
        : accountDigits.length >=
          (method === "Mobile money" || method === "M-Pesa" ? 8 : 6);
  const demoNames = [
    "Ada Okafor",
    "Daniel Mensah",
    "Amara Ndlovu",
    "David Kamau",
    "Zainab Bello",
    "Kwame Boateng",
  ];
  const resolvedName = lookupReady
    ? demoNames[Number(accountDigits.slice(-1)) % demoNames.length]
    : selected?.name || "";
  const displayAccount =
    newAccount && newAccount !== selected?.account && newAccount.length > 4
      ? `•••• ${newAccount.slice(-4)}`
      : selected?.account || newAccount;
  const visibleRecipients = recipients.filter((item) =>
    `${item.name} ${item.country} ${item.method} ${item.provider || ""}`
      .toLowerCase()
      .includes(recipientSearch.toLowerCase()),
  );
  const currentProviders = payoutProviders(country, method);
  const stageLabels = ["Recipient", "Amount", "Payout", "Details", "Review"];

  const chooseRecipient = (recipient: Recipient) => {
    setRecipientId(String(recipient.id));
    setTargetRecipientId(recipient.id);
    setCountry(recipient.country);
    setNewName(recipient.name);
    setNewAccount(recipient.account);
    setMethod(recipient.method);
    setProvider(
      recipient.provider ||
        payoutProviders(recipient.country, recipient.method)[0] ||
        "",
    );
    setAddingRecipient(false);
  };
  const startNewRecipient = () => {
    setRecipientId("");
    setTargetRecipientId(null);
    setNewName("");
    setNewAccount("");
    setProvider(payoutProviders(country, method)[0] || "");
    setAddingRecipient(true);
    setSaveRecipient(false);
  };
  const finish = () => {
    if (!description.trim()) {
      setError("Add a short description for this transfer.");
      return;
    }
    const name = resolvedName || newName.trim() || "Demo recipient";
    const recipient: Recipient = selected
      ? {
          ...selected,
          name,
          country,
          method,
          account: newAccount.trim() || selected.account,
          provider: provider || selected.provider,
        }
      : {
          id: Date.now(),
          name,
          country,
          method,
          account: newAccount.trim(),
          initials: name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase(),
          provider,
        };
    if (selected)
      setRecipients(
        recipients.map((item) => (item.id === selected.id ? recipient : item)),
      );
    else if (saveRecipient) setRecipients([...recipients, recipient]);
    const transfer: Transfer = {
      id: `ST-${Math.floor(100000 + Math.random() * 899999)}`,
      name: recipient.name,
      country,
      amount: Number(amount),
      currency: sendCurrency,
      status: "Pending",
      date: "Just now",
      provider:
        provider ||
        (method === "Stablecoin"
          ? asset
          : method === "Recipient tag"
            ? "Settle tag"
            : ""),
      method,
      usdAmount,
      recipientAmount: receiveRate ? recipientAmount : undefined,
      recipientCurrency: destinationCurrency,
      feeAmount,
      feeCurrency: sendCurrency,
      exchangeRate: receiveRate ? exchangeRate : undefined,
      description: description.trim(),
    };
    setTransfers([transfer, ...transfers]);
    setTargetRecipientId(null);
    setSuccess(true);
  };

  if (success)
    return (
      <div className="success-screen">
        <div className="success-art">
          <span>
            <Icon name="check" size={32} />
          </span>
          <i />
          <i />
          <i />
        </div>
        <span className="eyebrow">TRANSFER REQUEST RECEIVED</span>
        <h1>Transfer ready.</h1>
        <p>
          Your demo transfer to{" "}
          <strong>{resolvedName || selected?.name || newName}</strong> is in
          your activity. No real money has moved.
        </p>
        <div className="success-summary">
          <span>Amount sent</span>
          <strong>
            {Number(amount).toFixed(2)} {sendCurrency}
          </strong>
          <span>Recipient gets</span>
          <strong>
            {receiveRate
              ? `${recipientAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${destinationCurrency}`
              : "Rate unavailable in demo"}
          </strong>
        </div>
        <button
          className="button button-primary"
          onClick={() => setPage("Transactions")}
        >
          View transactions <span>→</span>
        </button>
        <button
          className="button button-quiet"
          onClick={() => {
            setStep(1);
            setRecipientId("");
            setCountry(defaultCountry);
            setNewName("");
            setNewAccount("");
            setAmount("");
            setSendCurrency("USD");
            setMethod("Bank transfer");
            setProvider(
              payoutProviders(defaultCountry, "Bank transfer")[0] || "",
            );
            setDescription("");
            setSuccess(false);
          }}
        >
          Make another transfer
        </button>
      </div>
    );

  const updateMethod = (nextMethod: string) => {
    setMethod(nextMethod);
    setProvider(
      nextMethod === "Stablecoin"
        ? "USDC"
        : nextMethod === "Recipient tag"
          ? "Settle tag"
          : payoutProviders(country, nextMethod)[0] || "",
    );
    setNewAccount("");
    setError("");
  };
  const continueFlow = () => {
    setError("");
    if (step === 1) {
      if (!recipientId && !newName.trim()) {
        setError("Choose a saved recipient or add a name to continue.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!amount || Number(amount) <= 0) {
        setError("Enter an amount greater than zero.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (
        method === "Bank transfer" ||
        method === "Mobile money" ||
        method === "M-Pesa"
      ) {
        if (!provider) {
          setError("Choose a bank or mobile money provider.");
          return;
        }
      }
      setStep(4);
    } else if (step === 4) {
      const needsAccount =
        method === "Bank transfer" ||
        method === "Mobile money" ||
        method === "M-Pesa";
      if (
        needsAccount &&
        !recipientId &&
        (!newAccount.trim() || !lookupReady)
      ) {
        setError(
          method === "Mobile money" || method === "M-Pesa"
            ? "Enter a valid mobile number to preview the demo recipient."
            : "Enter a valid account number to preview the demo recipient.",
        );
        return;
      }
      if (
        (method === "Stablecoin" || method === "Recipient tag") &&
        !newAccount.trim()
      ) {
        setError(
          method === "Stablecoin"
            ? "Enter a wallet address to continue."
            : "Enter a recipient tag to continue.",
        );
        return;
      }
      setStep(5);
    } else finish();
  };

  return (
    <>
      <PageHeading
        eyebrow="SEND MONEY"
        title="Send money"
        subtitle="Choose a recipient, enter an amount, and review the details."
      />
      <div className="send-layout send-flow-layout">
        <div className="send-main">
          <div className="stepper send-flow-stepper">
            {stageLabels.map((label, index) => (
              <div
                key={label}
                className={`step-item ${step === index + 1 ? "current" : ""} ${step > index + 1 ? "done" : ""}`}
              >
                <span>
                  {step > index + 1 ? (
                    <Icon name="check" size={14} />
                  ) : (
                    `0${index + 1}`
                  )}
                </span>
                <small>{label}</small>
              </div>
            ))}
          </div>
          <section className="form-card send-flow-card">
            <div className="form-step-heading">
              <span className="step-number">0{step}</span>
              <div>
                <h2>
                  {
                    [
                      "Who are you sending to?",
                      "Enter an amount",
                      "Choose a payout method",
                      "Enter receiver details",
                      "Review transfer",
                    ][step - 1]
                  }
                </h2>
                <p>
                  {
                    [
                      "Select someone saved or add a new receiver.",
                      "Choose the currency and amount to send.",
                      "Pick how the receiver should get the funds.",
                      "Add the receiving details for this destination.",
                      "Confirm the recipient and transfer breakdown.",
                    ][step - 1]
                  }
                </p>
              </div>
            </div>
            {step === 1 && (
              <div className="send-recipient-stage">
                <button
                  className="button button-secondary send-add-recipient"
                  onClick={startNewRecipient}
                >
                  <Icon name="plus" size={17} /> Add a new receiver
                </button>
                <label className="search-field send-recipient-search">
                  <Icon name="search" />
                  <input
                    value={recipientSearch}
                    onChange={(event) => setRecipientSearch(event.target.value)}
                    placeholder="Search by name, account, or bank"
                  />
                </label>
                {addingRecipient && (
                  <div className="send-new-recipient">
                    <div className="send-new-recipient-heading">
                      <strong>New receiver</strong>
                      <button
                        className="text-button"
                        onClick={() => setAddingRecipient(false)}
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="send-new-recipient-fields">
                      <label>
                        Receiver name
                        <input
                          value={newName}
                          onChange={(event) => setNewName(event.target.value)}
                          placeholder="Full name or business name"
                        />
                      </label>
                      <div className="country-field">
                        <span className="field-label">Destination country</span>
                        <CountrySelect
                          value={country}
                          onChange={(nextCountry) => {
                            setCountry(nextCountry);
                            setProvider(
                              payoutProviders(nextCountry, method)[0] || "",
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div className="send-saved-heading">
                  <h3>Saved recipients</h3>
                  <span>{visibleRecipients.length} saved</span>
                </div>
                <div className="send-recipient-list">
                  {visibleRecipients.map((recipient) => (
                    <button
                      key={recipient.id}
                      className={`send-recipient-row ${recipientId === String(recipient.id) ? "selected" : ""}`}
                      onClick={() => chooseRecipient(recipient)}
                      aria-pressed={recipientId === String(recipient.id)}
                    >
                      <span className="avatar avatar-soft">
                        {recipient.initials}
                      </span>
                      <span className="send-recipient-copy">
                        <strong>{recipient.name}</strong>
                        <small>
                          <CountryBadge country={recipient.country} />{" "}
                          <span>·</span>{" "}
                          {recipient.provider || recipient.method}
                        </small>
                      </span>
                      <span className="send-recipient-account">
                        {recipient.account || "New receiver"}
                      </span>
                      <span className="send-radio" />
                    </button>
                  ))}
                  {visibleRecipients.length === 0 && !addingRecipient && (
                    <div className="send-empty-recipients">
                      No saved recipients match. Add a new receiver to continue.
                    </div>
                  )}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="send-amount-stage">
                <div className="send-field-block">
                  <label htmlFor="send-currency">You send</label>
                  <div className="send-currency-input">
                    <span className="send-currency-select">
                      <CountryFlag
                        code={sourceCurrencyFlags[sendCurrency]}
                        country={sendCurrency}
                      />
                      <select
                        id="send-currency"
                        value={sendCurrency}
                        onChange={(event) =>
                          setSendCurrency(event.target.value)
                        }
                      >
                        <option value="USD">USD · US Dollar</option>
                        <option value="GBP">GBP · British Pound</option>
                        <option value="EUR">EUR · Euro</option>
                        <option value="NGN">NGN · Nigerian Naira</option>
                      </select>
                      <Icon name="chevron" size={16} />
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0.00"
                      aria-label="Amount to send"
                    />
                  </div>
                  <div className="send-balance">
                    <span>Demo available balance</span>
                    <strong>USD 4,250.00</strong>
                  </div>
                </div>
                <div className="send-field-block">
                  <label>Recipient gets · {destinationCurrency}</label>
                  <div className="send-currency-input send-currency-output">
                    <span className="send-currency-select">
                      <CountryFlag
                        code={countryFlag(country)}
                        country={country}
                      />
                      <strong>{destinationCurrency}</strong>
                    </span>
                    <output>
                      {receiveRate
                        ? recipientAmount
                          ? recipientAmount.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })
                          : "0.00"
                        : "Unavailable in demo"}
                    </output>
                  </div>
                  <small className="send-inline-note">
                    Estimate updates when you enter an amount. Rates and fees
                    are simulated.
                  </small>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="send-method-stage">
                {[
                  {
                    title: "Bank account",
                    note: "Send to a local bank account",
                    icon: "building",
                    value: "Bank transfer",
                  },
                  {
                    title: "Stablecoin",
                    note: "Send a supported digital asset",
                    icon: "card",
                    value: "Stablecoin",
                    badge: "Demo",
                  },
                  {
                    title: "Mobile money",
                    note: "Send to a mobile wallet",
                    icon: "send",
                    value: "Mobile money",
                  },
                  {
                    title: "Recipient tag",
                    note: "Send using a Settle tag",
                    icon: "user",
                    value: "Recipient tag",
                    badge: "Demo",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`send-method-card ${method === option.value || (option.value === "Mobile money" && method === "M-Pesa") ? "selected" : ""}`}
                    onClick={() => updateMethod(option.value)}
                  >
                    <span className="send-method-icon">
                      <Icon name={option.icon} size={20} />
                    </span>
                    <span>
                      <strong>{option.title}</strong>
                      <small>{option.note}</small>
                    </span>
                    {option.badge && <em>{option.badge}</em>}
                    <i className="send-radio" />
                  </button>
                ))}
              </div>
            )}
            {step === 4 && (
              <div className="send-details-stage">
                <div className="send-detail-context">
                  <CountryBadge country={country} />
                  <span>Receiving currency</span>
                  <strong>{destinationCurrency}</strong>
                </div>
                {(method === "Bank transfer" ||
                  method === "Mobile money" ||
                  method === "M-Pesa") && (
                  <label className="send-full-field">
                    <span>
                      {method === "Mobile money" || method === "M-Pesa"
                        ? "Mobile money provider"
                        : "Receiver bank"}
                    </span>
                    <select
                      value={provider}
                      onChange={(event) => {
                        setProvider(event.target.value);
                        setNewAccount("");
                      }}
                    >
                      <option value="">
                        Select{" "}
                        {method === "Mobile money" || method === "M-Pesa"
                          ? "provider"
                          : "bank"}
                      </option>
                      {currentProviders.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                )}
                {method === "Bank transfer" && (
                  <label className="send-full-field">
                    <span>Receiver type</span>
                    <select
                      value={receiverType}
                      onChange={(event) => setReceiverType(event.target.value)}
                    >
                      <option>Personal</option>
                      <option>Business</option>
                    </select>
                  </label>
                )}
                {method === "Stablecoin" && (
                  <label className="send-full-field">
                    <span>Asset</span>
                    <select
                      value={asset}
                      onChange={(event) => setAsset(event.target.value)}
                    >
                      <option>USDC</option>
                      <option>USDT</option>
                    </select>
                  </label>
                )}
                <label className="send-full-field">
                  <span>
                    {method === "Mobile money" || method === "M-Pesa"
                      ? "Phone number"
                      : method === "Stablecoin"
                        ? "Wallet address"
                        : method === "Recipient tag"
                          ? "Recipient tag"
                          : "Account number"}
                  </span>
                  <input
                    inputMode={
                      method === "Mobile money" || method === "M-Pesa"
                        ? "tel"
                        : "text"
                    }
                    value={newAccount}
                    onChange={(event) => {
                      setNewAccount(event.target.value);
                      if (!selected) setNewName("");
                    }}
                    placeholder={
                      method === "Mobile money" || method === "M-Pesa"
                        ? `e.g. ${callingCodes[country] || "country code"} 712 345 678`
                        : method === "Stablecoin"
                          ? "Paste a wallet address"
                          : method === "Recipient tag"
                            ? "@recipient"
                            : "Enter the bank account number"
                    }
                  />
                </label>
                {resolvedName && (
                  <div className="demo-name-preview">
                    <span className="demo-name-icon">
                      <Icon name="check" size={16} />
                    </span>
                    <div>
                      <small>
                        {selected
                          ? "SAVED RECIPIENT"
                          : method === "Stablecoin"
                            ? "DEMO WALLET PREVIEW"
                            : method === "Recipient tag"
                              ? "DEMO TAG PREVIEW"
                              : "DEMO ACCOUNT MATCH"}
                      </small>
                      <strong>{resolvedName}</strong>
                      <span>
                        {selected
                          ? `${provider || selected.provider || method} · ${country}`
                          : "Prototype preview only · details are not verified"}
                      </span>
                    </div>
                  </div>
                )}
                {!selected &&
                  (method === "Bank transfer" || method === "Mobile money") &&
                  lookupReady &&
                  newName &&
                  resolvedName &&
                  newName.toLowerCase() !== resolvedName.toLowerCase() && (
                    <div className="send-match-note">
                      The demo account name differs from the name entered.
                      Review the match before continuing.
                    </div>
                  )}
                {!selected &&
                  (method === "Bank transfer" || method === "Mobile money") &&
                  !lookupReady && (
                    <div className="send-inline-note">
                      Enter{" "}
                      {method === "Mobile money"
                        ? "a phone number"
                        : "an account number"}{" "}
                      to show the demo account name.
                    </div>
                  )}
                {(method === "Stablecoin" || method === "Recipient tag") && (
                  <div className="send-inline-note">
                    This payout option is a prototype preview. No wallet
                    transfer or tag payment will be sent.
                  </div>
                )}
                {!selected && (
                  <label className="send-save-recipient">
                    <input
                      type="checkbox"
                      checked={saveRecipient}
                      onChange={(event) =>
                        setSaveRecipient(event.target.checked)
                      }
                    />{" "}
                    Save this receiver for next time
                  </label>
                )}
              </div>
            )}
            {step === 5 && (
              <div className="send-review-stage">
                <div className="send-review-hero">
                  <div>
                    <small>YOU SEND</small>
                    <strong>
                      {Number(amount || 0).toFixed(2)} {sendCurrency}
                    </strong>
                  </div>
                  <span>
                    <CountryFlag
                      code={sourceCurrencyFlags[sendCurrency]}
                      country={sendCurrency}
                    />
                    <Icon name="arrow" size={18} />
                    <CountryFlag
                      code={countryFlag(country)}
                      country={country}
                    />
                  </span>
                  <div>
                    <small>RECIPIENT GETS</small>
                    <strong>
                      {receiveRate
                        ? `${recipientAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${destinationCurrency}`
                        : "Rate unavailable in demo"}
                    </strong>
                  </div>
                </div>
                <label className="send-full-field send-description">
                  <span>
                    Description <em>Required</em>
                  </span>
                  <input
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What is this transfer for?"
                  />
                </label>
                <div className="send-review-section">
                  <h3>Receiver details</h3>
                  <dl>
                    <div>
                      <dt>Account name</dt>
                      <dd>{resolvedName || "Demo recipient"}</dd>
                    </div>
                    <div>
                      <dt>
                        {method === "Mobile money" || method === "M-Pesa"
                          ? "Phone number"
                          : method === "Stablecoin"
                            ? "Wallet address"
                            : method === "Recipient tag"
                              ? "Recipient tag"
                              : "Account number"}
                      </dt>
                      <dd>{displayAccount || newAccount}</dd>
                    </div>
                    <div>
                      <dt>
                        {method === "Bank transfer"
                          ? "Bank name"
                          : method === "Mobile money" || method === "M-Pesa"
                            ? "Provider"
                            : method === "Stablecoin"
                              ? "Asset"
                              : "Payment method"}
                      </dt>
                      <dd>
                        {method === "Stablecoin"
                          ? asset
                          : method === "Recipient tag"
                            ? "Settle tag"
                            : provider}
                      </dd>
                    </div>
                    <div>
                      <dt>Destination country</dt>
                      <dd>
                        <CountryBadge country={country} />
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="send-review-section">
                  <h3>Transfer details</h3>
                  <dl>
                    <div>
                      <dt>You send</dt>
                      <dd>
                        {Number(amount || 0).toFixed(2)} {sendCurrency}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        Total fee <em>DEMO</em>
                      </dt>
                      <dd>
                        {feeAmount.toFixed(2)} {sendCurrency}
                      </dd>
                    </div>
                    <div>
                      <dt>Amount converted</dt>
                      <dd>{amountToConvert.toFixed(2)} USD</dd>
                    </div>
                    <div>
                      <dt>Recipient gets</dt>
                      <dd>
                        {receiveRate
                          ? `${recipientAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${destinationCurrency}`
                          : "Rate unavailable in demo"}
                      </dd>
                    </div>
                    <div>
                      <dt>Exchange rate</dt>
                      <dd>
                        {receiveRate
                          ? `1 ${sendCurrency} = ${exchangeRate.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${destinationCurrency}`
                          : "Rate unavailable in demo"}
                      </dd>
                    </div>
                    <div>
                      <dt>Estimated arrival</dt>
                      <dd>Within minutes</dd>
                    </div>
                    <div>
                      <dt>Send with</dt>
                      <dd>
                        {method === "Stablecoin"
                          ? asset
                          : method === "Recipient tag"
                            ? "Settle tag"
                            : provider}{" "}
                        <button
                          className="text-button"
                          onClick={() => setStep(3)}
                        >
                          Change
                        </button>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="disclaimer">
                  <Icon name="shield" size={17} />
                  <span>
                    Prototype only. Rates, fees, and payout status are
                    simulated. No money will be moved.
                  </span>
                </div>
              </div>
            )}
            {error && <div className="notice error-notice">{error}</div>}
            <div className="form-actions">
              {step > 1 && (
                <button
                  className="button button-quiet"
                  onClick={() => {
                    setStep(step - 1);
                    setError("");
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                className="button button-primary"
                onClick={() => (step === 5 ? finish() : continueFlow())}
              >
                {step === 5 ? "Confirm demo transfer" : "Continue"}{" "}
                <span>→</span>
              </button>
            </div>
          </section>
        </div>
        <aside className="transfer-aside send-flow-aside">
          <span className="aside-kicker">
            <i /> TRANSFER PREVIEW
          </span>
          <div className="route-preview">
            <div className="route-cities">
              <span className="city-dot city-start" />
              <div className="dotted-route" />
              <span className="city-dot city-end" />
            </div>
            <div className="route-labels">
              <div>
                <strong>Your account</strong>
                <small>Sending from</small>
              </div>
              <div>
                <strong>
                  {selected?.name || newName || "Choose receiver"}
                </strong>
                <small>{country || "Destination"}</small>
              </div>
            </div>
          </div>
          <div className="aside-separator" />
          <div className="aside-line">
            <span>You send</span>
            <strong>
              {Number(amount || 0).toFixed(2)} {sendCurrency}
            </strong>
          </div>
          <div className="aside-line">
            <span>Transfer fee</span>
            <strong>
              {feeAmount.toFixed(2)} {sendCurrency}{" "}
              <i className="demo-pill">DEMO</i>
            </strong>
          </div>
          <div className="aside-line">
            <span>Recipient gets</span>
            <strong>
              {receiveRate
                ? `${recipientAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${destinationCurrency}`
                : "Rate unavailable in demo"}
            </strong>
          </div>
          <div className="aside-help">
            <Icon name="shield" size={17} />
            <span>
              <strong>
                {method === "Stablecoin" || method === "Recipient tag"
                  ? "Demo route"
                  : provider || "Bank or mobile money"}
              </strong>
              <small>Review every detail before confirming.</small>
            </span>
          </div>
          <div className="prototype-note">
            Illustrative preview only. Nothing is sent or charged.
          </div>
        </aside>
      </div>
    </>
  );
}
function Recipients({
  recipients,
  setRecipients,
  onSend,
  query,
  setQuery,
}: {
  recipients: Recipient[];
  setRecipients: (items: Recipient[]) => void;
  onSend: (id: number) => void;
  query: string;
  setQuery: (q: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(
    null,
  );
  const [recipientName, setRecipientName] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [account, setAccount] = useState("");
  const [method, setMethod] = useState("Bank transfer");
  const [notice, setNotice] = useState("");
  const filtered = recipients.filter((item) =>
    `${item.name} ${item.country} ${item.method}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const closeRecipientModal = () => {
    setShowAdd(false);
    setEditingRecipient(null);
    setRecipientName("");
    setCountry("Nigeria");
    setAccount("");
    setMethod("Bank transfer");
  };
  const editRecipient = (recipient: Recipient) => {
    setEditingRecipient(recipient);
    setRecipientName(recipient.name);
    setCountry(recipient.country);
    setAccount(recipient.account);
    setMethod(recipient.method);
  };
  const add = (event: React.FormEvent) => {
    event.preventDefault();
    if (!recipientName.trim() || !account.trim()) return;
    const nextRecipient = {
      id: editingRecipient?.id || Date.now(),
      name: recipientName.trim(),
      country,
      method,
      account: account.trim(),
      initials: recipientName
        .trim()
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    };
    setRecipients(
      editingRecipient
        ? recipients.map((item) =>
            item.id === editingRecipient.id ? nextRecipient : item,
          )
        : [...recipients, nextRecipient],
    );
    setNotice(
      editingRecipient
        ? `${recipientName.trim()}’s details were updated.`
        : `${recipientName.trim()} was added to your recipients.`,
    );
    closeRecipientModal();
    setTimeout(() => setNotice(""), 3500);
  };
  return (
    <>
      <PageHeading
        eyebrow="YOUR PEOPLE"
        title="Recipients"
        subtitle=""
        action={
          <button
            className="button button-primary"
            onClick={() => {
              closeRecipientModal();
              setShowAdd(true);
            }}
          >
            <Icon name="plus" /> Add recipient
          </button>
        }
      />
      {notice && (
        <div className="notice success-notice recipient-notice">
          <Icon name="check" size={16} />
          {notice}
        </div>
      )}
      <div className="list-toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipients"
          />
        </label>
        <span>
          {filtered.length} saved{" "}
          {filtered.length === 1 ? "recipient" : "recipients"}
        </span>
      </div>
      <div className="recipient-grid">
        {filtered.map((recipient) => (
          <article className="recipient-card" key={recipient.id}>
            <div className="recipient-card-top">
              <span className="avatar avatar-soft">{recipient.initials}</span>
              <button
                className="more-button"
                aria-label={`Edit ${recipient.name}`}
                title="Edit recipient"
                onClick={() => editRecipient(recipient)}
              >
                •••
              </button>
            </div>
            <h3>{recipient.name}</h3>
            <p>
              <CountryBadge country={recipient.country} /> <span>·</span>{" "}
              {recipient.method}
            </p>
            <div className="recipient-account">
              <span>Account details</span>
              <strong>{recipient.account}</strong>
            </div>
            <div className="recipient-card-actions">
              <button
                className="button button-primary"
                onClick={() => onSend(recipient.id)}
              >
                Send money <span>→</span>
              </button>
              <button
                className="icon-button"
                title={`Remove ${recipient.name}`}
                aria-label={`Remove ${recipient.name}`}
                onClick={() => {
                  if (
                    window.confirm(
                      `Remove ${recipient.name} from your saved recipients?`,
                    )
                  ) {
                    setRecipients(
                      recipients.filter((item) => item.id !== recipient.id),
                    );
                    setNotice(
                      `${recipient.name} was removed from your recipients.`,
                    );
                    setTimeout(() => setNotice(""), 3500);
                  }
                }}
              >
                <Icon name="close" size={17} />
              </button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="users" size={22} />
            </span>
            <h3>No recipients found</h3>
            <p>Try a different search or add someone new.</p>
            <button
              className="button button-primary"
              onClick={() => {
                closeRecipientModal();
                setShowAdd(true);
              }}
            >
              Add a recipient
            </button>
          </div>
        )}
      </div>
      {(showAdd || editingRecipient) && (
        <div className="modal-scrim" onClick={closeRecipientModal}>
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              onClick={closeRecipientModal}
              aria-label="Close"
            >
              <Icon name="close" />
            </button>
            <span className="eyebrow">
              {editingRecipient ? "EDIT RECIPIENT" : "NEW RECIPIENT"}
            </span>
            <h2>
              {editingRecipient
                ? "Update recipient details"
                : "Add someone to your list"}
            </h2>
            <p>
              {editingRecipient
                ? "Keep their payout details up to date."
                : "You can save someone now and send to them later."}
            </p>
            <form className="modal-form" onSubmit={add}>
              <label>
                Recipient’s full name
                <input
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Ada Okafor"
                />
              </label>
              <div className="country-field">
                <span>Country</span>
                <CountrySelect value={country} onChange={setCountry} />
              </div>
              <label>
                Receiving method
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option>Bank transfer</option>
                  <option>Mobile money</option>
                  <option>M-Pesa</option>
                </select>
              </label>
              <label>
                Account number or phone
                <input
                  required
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="Enter recipient details"
                />
              </label>
              <button className="button button-primary" type="submit">
                {editingRecipient ? "Save changes" : "Save recipient"}{" "}
                <span>→</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function TransferTable({
  transfers,
  onSelect,
}: {
  transfers: Transfer[];
  onSelect: (transfer: Transfer) => void;
}) {
  return (
    <div className="table-wrap">
      <table className="transfer-table">
        <thead>
          <tr>
            <th>RECIPIENT</th>
            <th>REFERENCE</th>
            <th>DATE</th>
            <th>AMOUNT SENT</th>
            <th>STATUS</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer) => (
            <tr key={transfer.id}>
              <td>
                <span className="table-recipient">
                  <span className="avatar avatar-soft">
                    {transfer.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span>
                    <strong>{transfer.name}</strong>
                    <small>
                      <CountryBadge country={transfer.country} />
                    </small>
                  </span>
                </span>
              </td>
              <td>
                <code>{transfer.id}</code>
              </td>
              <td>{transfer.date}</td>
              <td>
                <strong>
                  {transfer.currency} {transfer.amount.toFixed(2)}
                </strong>
              </td>
              <td>
                <span
                  className={`status status-${transfer.status.toLowerCase()}`}
                >
                  <i />
                  {transfer.status}
                </span>
              </td>
              <td>
                <button
                  className="row-arrow"
                  onClick={() => onSelect(transfer)}
                  aria-label={`View ${transfer.id}`}
                >
                  <Icon name="chevron" size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Transactions({
  transfers,
  query,
  setQuery,
  onSelectTransfer,
}: {
  transfers: Transfer[];
  query: string;
  setQuery: (q: string) => void;
  onSelectTransfer: (transfer: Transfer) => void;
}) {
  const [status, setStatus] = useState("All statuses");
  const filtered = transfers.filter(
    (item) =>
      `${item.name} ${item.id} ${item.country}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "All statuses" || item.status === status),
  );
  const totalUsd = transfers.reduce(
    (sum, item) =>
      sum +
      (item.usdAmount ??
        (item.currency === "GBP"
          ? item.amount * 1.27
          : item.currency === "EUR"
            ? item.amount * 1.08
            : item.currency === "NGN"
              ? item.amount / 1550
              : item.amount)),
    0,
  );
  const clearFilters = () => {
    setQuery("");
    setStatus("All statuses");
  };
  return (
    <>
      <PageHeading
        eyebrow="MONEY IN MOTION"
        title="Transactions"
        subtitle=""
        action={
          <button
            className="button button-secondary"
            onClick={() => {
              const csv = [
                "Reference,Recipient,Country,Amount,Currency,Status,Date",
                ...transfers.map(
                  (item) =>
                    `${item.id},${item.name},${item.country},${item.amount},${item.currency},${item.status},${item.date}`,
                ),
              ].join("\n");
              const url = URL.createObjectURL(
                new Blob([csv], { type: "text/csv" }),
              );
              const link = document.createElement("a");
              link.href = url;
              link.download = "settle-transactions-demo.csv";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Icon name="download" size={17} /> Export
          </button>
        }
      />
      <div className="transaction-stats">
        <div>
          <small>TRANSFERRED</small>
          <strong>
            ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span> USD</span>
          </strong>
        </div>
        <div>
          <small>TRANSFERS</small>
          <strong>{transfers.length}</strong>
        </div>
        <div>
          <small>RECIPIENTS</small>
          <strong>{new Set(transfers.map((item) => item.name)).size}</strong>
        </div>
        <div>
          <small>IN PROGRESS</small>
          <strong>
            {
              transfers.filter(
                (item) =>
                  item.status === "Pending" || item.status === "Processing",
              ).length
            }
          </strong>
        </div>
      </div>
      <div className="list-toolbar transaction-toolbar">
        <label className="search-field">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or reference"
          />
        </label>
        <select
          className="filter-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>All statuses</option>
          <option>Pending</option>
          <option>Processing</option>
          <option>Completed</option>
        </select>
        <button
          className="button button-secondary button-small"
          onClick={clearFilters}
        >
          Clear filters
        </button>
      </div>
      <div className="table-panel">
        <div className="table-panel-heading">
          <div>
            <h2>Transfer history</h2>
            <p>{filtered.length} transactions</p>
          </div>
        </div>
        <TransferTable transfers={filtered} onSelect={onSelectTransfer} />
        {filtered.length === 0 && (
          <div className="table-empty">No transactions match your search.</div>
        )}
      </div>
    </>
  );
}
function TransactionDetails({
  transfer,
  onClose,
}: {
  transfer: Transfer;
  onClose: () => void;
}) {
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);
  const currency: Record<string, string> = {
    Nigeria: "NGN",
    Ghana: "GHS",
    Kenya: "KES",
    Uganda: "UGX",
    Tanzania: "TZS",
    Rwanda: "RWF",
    Egypt: "EGP",
  };
  const rate: Record<string, number> = {
    NGN: 1550,
    GHS: 15.2,
    KES: 129,
    UGX: 3720,
    TZS: 2670,
    RWF: 1370,
    EGP: 48.5,
  };
  const toCurrency =
    transfer.recipientCurrency || currency[transfer.country] || "NGN";
  const hasRate =
    transfer.recipientAmount !== undefined || rate[toCurrency] !== undefined;
  const converted =
    transfer.recipientAmount ??
    (transfer.usdAmount ?? transfer.amount) * (rate[toCurrency] || 0);
  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(transfer.id);
      setNotice("Reference copied.");
    } catch {
      setNotice(`Reference: ${transfer.id}`);
    }
  };
  return (
    <div
      className="details-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="details-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="details-title"
      >
        <header className="details-header">
          <button
            className="details-back"
            onClick={onClose}
            aria-label="Close transaction details"
          >
            ←
          </button>
          <div>
            <span className="eyebrow">TRANSFER ACTIVITY</span>
            <h2 id="details-title">Transaction details</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <div className="details-body">
          <div className="details-recipient">
            <span className="avatar avatar-soft avatar-large">
              {transfer.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <span className={`status status-${transfer.status.toLowerCase()}`}>
              <i />
              {transfer.status}
            </span>
            <small>Sent to {transfer.name}</small>
            <strong>
              {transfer.currency} {transfer.amount.toFixed(2)}
            </strong>
            <span>{transfer.date}</span>
          </div>
          <section className="detail-box">
            <h3>
              <span className="detail-box-icon">
                <Icon name="card" size={15} />
              </span>
              TRANSFER BREAKDOWN
            </h3>
            <div>
              <span>You sent</span>
              <strong>
                {transfer.currency} {transfer.amount.toFixed(2)}
              </strong>
            </div>
            <div>
              <span>
                Exchange rate <i className="demo-pill">DEMO</i>
              </span>
              <strong>
                {hasRate
                  ? `1 ${transfer.currency} = ${(transfer.exchangeRate ?? rate[toCurrency]).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toCurrency}`
                  : "Rate unavailable in demo"}
              </strong>
            </div>
            <div>
              <span>
                Transfer fee <i className="demo-pill">DEMO</i>
              </span>
              <strong>
                {(transfer.feeAmount ?? 2.99).toFixed(2)}{" "}
                {transfer.feeCurrency || transfer.currency}
              </strong>
            </div>
            <div className="detail-total">
              <span>Estimated recipient gets</span>
              <strong>
                {hasRate
                  ? `${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${toCurrency}`
                  : "Rate unavailable in demo"}
              </strong>
            </div>
            {transfer.description && (
              <div>
                <span>Description</span>
                <strong>{transfer.description}</strong>
              </div>
            )}
            {transfer.provider && (
              <div>
                <span>
                  {transfer.method === "Mobile money" ||
                  transfer.method === "M-Pesa"
                    ? "Mobile money provider"
                    : "Destination bank"}
                </span>
                <strong>{transfer.provider}</strong>
              </div>
            )}
            <div>
              <span>Recipient</span>
              <strong>
                {transfer.name}
                <small>
                  <CountryBadge country={transfer.country} /> ·{" "}
                  {transfer.method || "Bank transfer"}
                </small>
              </strong>
            </div>
          </section>
          <section className="reference-box">
            <span>TRANSACTION REFERENCE</span>
            <button onClick={copyReference}>
              <code>{transfer.id}</code>
              <Icon name="copy" size={15} />
            </button>
          </section>
          {transfer.batchId && (
            <section className="reference-box bulk-reference-box">
              <span>BULK BATCH REFERENCE</span>
              <code>{transfer.batchId}</code>
            </section>
          )}
          {notice && (
            <div className="notice success-notice details-notice">
              <Icon name="check" size={15} />
              {notice}
            </div>
          )}
          <p className="details-disclaimer">
            Demo transaction details. Rates, fees, statuses, and delivery
            information are simulated.
          </p>
          <button
            className="report-issue"
            onClick={() =>
              setNotice(
                "Issue reporting will be available when the support workflow is connected.",
              )
            }
          >
            <Icon name="search" size={15} /> Report an issue
          </button>
        </div>
        <footer className="details-footer">
          <button
            className="button button-primary"
            onClick={() =>
              setNotice(
                "Receipt sharing will be available when connected to the transfer service.",
              )
            }
          >
            <Icon name="copy" size={15} /> Share receipt
          </button>
        </footer>
      </aside>
    </div>
  );
}

function Track({ transfers }: { transfers: Transfer[] }) {
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<Transfer | null | undefined>(undefined);
  const [error, setError] = useState("");
  const lookup = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const found = transfers.find(
      (item) => item.id.toLowerCase() === reference.trim().toLowerCase(),
    );
    setResult(found || null);
    if (!reference.trim()) setError("Enter a transfer reference to search.");
  };
  const completed = result?.status === "Completed";
  const processing = result?.status === "Processing";
  return (
    <>
      <PageHeading
        eyebrow="TRANSFER STATUS"
        title="Track a transfer"
        subtitle="Enter a payment reference."
      />
      <section className="track-panel">
        <div className="track-icon">
          <Icon name="search" size={22} />
        </div>
        <form className="track-form" onSubmit={lookup}>
          <label htmlFor="reference">REFERENCE NUMBER</label>
          <div>
            <input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. ST-240918"
            />
            <button className="button button-primary" type="submit">
              Track transfer <span>→</span>
            </button>
          </div>
          {error && <small className="field-error">{error}</small>}
        </form>
        <div className="track-example">
          <span>Demo references</span>
          {transfers.slice(0, 3).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setReference(item.id);
                setResult(item);
                setError("");
              }}
            >
              {item.id}
            </button>
          ))}
        </div>
      </section>
      {result && result !== null && (
        <section className="track-result">
          <div className="track-result-head">
            <span className={`status status-${result.status.toLowerCase()}`}>
              <i />
              {result.status}
            </span>
            <span>
              Reference <code>{result.id}</code>
            </span>
          </div>
          <h2>
            {result.name} · {result.country}
          </h2>
          <p>
            {result.currency} {result.amount.toFixed(2)} · {result.date}
          </p>
          <div className="timeline">
            <div className="timeline-item complete">
              <span>
                <Icon name="check" size={13} />
              </span>
              <div>
                <strong>Request received</strong>
                <small>Reference created in this demo.</small>
              </div>
            </div>
            <div
              className={`timeline-item ${completed ? "complete" : "current"}`}
            >
              <span>{completed ? <Icon name="check" size={13} /> : <i />}</span>
              <div>
                <strong>
                  {completed
                    ? "Transfer completed"
                    : processing
                      ? "Transfer processing"
                      : "Awaiting processing"}
                </strong>
                <small>
                  {completed
                    ? "Marked complete in this demo."
                    : processing
                      ? "Status is simulated; no payment provider is connected."
                      : "This demo request has not been sent to a payment provider."}
                </small>
              </div>
            </div>
            <div className={`timeline-item ${completed ? "complete" : ""}`}>
              <span>{completed ? <Icon name="check" size={13} /> : <i />}</span>
              <div>
                <strong>Recipient delivery</strong>
                <small>
                  {completed
                    ? "Marked delivered in this demo."
                    : "Delivery updates appear when a provider is connected."}
                </small>
              </div>
            </div>
          </div>
        </section>
      )}
      {result === null && (
        <div className="notice error-notice track-not-found">
          No demo transfer found with that reference. Check the number and try
          again.
        </div>
      )}
    </>
  );
}
function Profile({
  name,
  setName,
  onLogout,
  accountType,
}: {
  name: string;
  setName: (name: string) => void;
  onLogout: () => void;
  accountType: AccountType;
}) {
  const isBusiness = accountType === "business";
  const [draft, setDraft] = useState(name);
  const [email, setEmail] = useState(
    () =>
      localStorage.getItem(`settle-demo-${accountType}-email`) ||
      (!isBusiness ? localStorage.getItem("settle-demo-email") : null) ||
      (isBusiness
        ? "accounts@chimaventures.example"
        : "chima.angwe@example.com"),
  );
  const [phone, setPhone] = useState(
    () =>
      localStorage.getItem(`settle-demo-${accountType}-phone`) ||
      (!isBusiness ? localStorage.getItem("settle-demo-phone") : null) ||
      "801 234 5678",
  );
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("Profile");
  const profileCountry =
    localStorage.getItem(`settle-demo-${accountType}-country`) || "Nigeria";
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = draft.trim();
    if (!cleanName) {
      setNotice(
        isBusiness
          ? "Enter your business name before saving."
          : "Enter your full name before saving.",
      );
      return;
    }
    setDraft(cleanName);
    setName(cleanName);
    localStorage.setItem(
      isBusiness ? "settle-demo-business-name" : "settle-demo-name",
      cleanName,
    );
    localStorage.setItem(`settle-demo-${accountType}-email`, email.trim());
    localStorage.setItem(`settle-demo-${accountType}-phone`, phone.trim());
    localStorage.setItem(
      isBusiness ? "settle-demo-business-email" : "settle-demo-email",
      email.trim(),
    );
    localStorage.setItem(
      isBusiness ? "settle-demo-business-phone" : "settle-demo-phone",
      phone.trim(),
    );
    setNotice("Your profile was updated in this prototype.");
    setTimeout(() => setNotice(""), 3000);
  };
  const tabs = ["Profile", "Linked banks", "Security", "Notifications", "Help & support"];
  return (
    <>
      <PageHeading
        eyebrow={isBusiness ? "BUSINESS ACCOUNT" : "YOUR ACCOUNT"}
        title="Profile & settings"
        subtitle=""
      />
      {notice && (
        <div className="notice success-notice">
          <Icon name="check" size={16} />
          {notice}
        </div>
      )}
      <div className="profile-v2">
        {tab === "Profile" ? (
          <div className="profile-overview">
            <section className="profile-hero">
              <span className="avatar avatar-light profile-hero-avatar">
                {isBusiness ? (
                  <Icon name="building" size={28} />
                ) : (
                  name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                )}
              </span>
              <div className="profile-hero-copy">
                <h2>{name}</h2>
                <span className="profile-tier">
                  <Icon name="shield" size={14} />{" "}
                  {isBusiness
                    ? "Business account · Demo"
                    : "Individual account · Demo"}
                </span>
              </div>
              <span className="profile-hero-mark">SETTLE AFRICA</span>
            </section>
            <section className="profile-summary-card">
              <h2>
                {isBusiness ? "Business account summary" : "Account summary"}
              </h2>
              <div className="profile-summary-grid">
                <div>
                  <span>Account reference</span>
                  <strong>
                    {isBusiness ? "BIZ-0001" : "SET-0001"} <small>DEMO</small>
                  </strong>
                </div>
                <div>
                  <span>Account type</span>
                  <strong>{isBusiness ? "Business" : "Individual"}</strong>
                </div>
                {isBusiness && (
                  <div>
                    <span>Business category</span>
                    <strong>
                      Small business <small>DEMO</small>
                    </strong>
                  </div>
                )}
                {isBusiness && (
                  <div>
                    <span>Registration status</span>
                    <strong>Details needed</strong>
                  </div>
                )}
              </div>
            </section>
            <section className="profile-kyc-panel">
              <div className="profile-section-heading">
                <h2>
                  {isBusiness ? "Business verification" : "KYC & compliance"}
                </h2>
                <button
                  onClick={() =>
                    setNotice(
                      `${isBusiness ? "Business" : "Identity"} verification will be connected in a later milestone.`,
                    )
                  }
                >
                  View verification <span>›</span>
                </button>
              </div>
              <div className="profile-kyc-status">
                <span className="profile-kyc-icon">
                  <Icon name="shield" size={20} />
                </span>
                <div>
                  <strong>
                    {isBusiness
                      ? "Company verification"
                      : "Identity verification"}
                  </strong>
                  <p>
                    {isBusiness
                      ? "Business verification requirements will depend on the supported markets and service providers."
                      : "Complete verification to unlock higher transfer limits and account features."}
                  </p>
                </div>
                <span className="verification-badge warning-badge">
                  NOT VERIFIED
                </span>
                <button
                  className="button button-primary button-small"
                  onClick={() =>
                    setNotice(
                      `${isBusiness ? "Business" : "Identity"} verification will be connected in a later milestone.`,
                    )
                  }
                >
                  Start verification
                </button>
              </div>
            </section>
            <section className="profile-personal-card">
              <div className="profile-section-heading">
                <div>
                  <h2>
                    {isBusiness ? "Business details" : "Personal details"}
                  </h2>
                </div>
              </div>
              <form className="profile-details-form" onSubmit={save}>
                <label className="profile-detail-row">
                  <span>{isBusiness ? "Business name" : "Full name"}</span>
                  <input
                    required
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                </label>
                <label className="profile-detail-row">
                  <span>{isBusiness ? "Business email" : "Email address"}</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="profile-detail-row">
                  <span>{isBusiness ? "Business phone" : "Phone number"}</span>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                <div className="profile-detail-row">
                  <span>Country</span>
                  <strong>
                    <CountryBadge country={profileCountry} />
                  </strong>
                </div>
                <button className="button button-primary" type="submit">
                  Save changes <span>→</span>
                </button>
              </form>
            </section>
          </div>
        ) : (
          <section className="profile-secondary-panel">
            {tab === "Linked banks" ? (
              <LinkedBanks country={profileCountry} onNotice={setNotice} />
            ) : tab === "Security" ? (
              <SecuritySettings onSaved={setNotice} />
            ) : tab === "Notifications" ? (
              <NotificationSettings />
            ) : (
              <HelpSupport onNotice={setNotice} />
            )}
          </section>
        )}
        <nav className="profile-tabs" aria-label="Profile settings">
          {tabs.map((item) => (
            <button
              key={item}
              className={tab === item ? "selected" : ""}
              onClick={() => setTab(item)}
            >
              <Icon
                name={
                  item === "Profile"
                    ? "user"
                    : item === "Linked banks"
                      ? "card"
                      : item === "Security"
                      ? "shield"
                      : item === "Notifications"
                        ? "bell"
                        : "search"
                }
                size={17}
              />
              {item}
            </button>
          ))}
          <button className="profile-tab-signout" onClick={onLogout}>
            <Icon name="logout" size={17} />
            Sign out
          </button>
        </nav>
      </div>
    </>
  );
}
function LinkedBanks({ country, onNotice }: { country: string; onNotice: (message: string) => void }) {
  const banksByCountry: Record<string, string[]> = {
    Nigeria: ["Access Bank", "First Bank of Nigeria", "GTBank", "Moniepoint MFB", "OPay", "UBA", "Zenith Bank"],
    Ghana: ["Absa Bank Ghana", "Ecobank Ghana", "Fidelity Bank Ghana", "GCB Bank"],
    Kenya: ["Absa Bank Kenya", "Co-operative Bank of Kenya", "Equity Bank", "KCB Bank"],
    SouthAfrica: ["Absa", "Capitec Bank", "FNB", "Nedbank", "Standard Bank"],
  };
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [linked, setLinked] = useState<{ bank: string; account: string }[]>(() => JSON.parse(localStorage.getItem("settle-demo-linked-banks") || "[]"));
  const connect = (event: React.FormEvent) => {
    event.preventDefault();
    if (!bank || accountNumber.replace(/\D/g, "").length < 8) return;
    const next = [...linked, { bank, account: accountNumber.replace(/\D/g, "").slice(-4) }];
    setLinked(next);
    localStorage.setItem("settle-demo-linked-banks", JSON.stringify(next));
    setBank(""); setAccountNumber("");
    onNotice("Bank link added as a demo. No bank authorization took place.");
  };
  const remove = (index: number) => {
    const next = linked.filter((_, itemIndex) => itemIndex !== index);
    setLinked(next); localStorage.setItem("settle-demo-linked-banks", JSON.stringify(next));
  };
  return <div className="settings-content linked-banks-content">
    <div className="settings-section-title"><h3>Linked banks</h3><p>Choose a bank account to use with your Settle Africa profile.</p></div>
    <div className="bank-link-demo-note"><Icon name="shield" size={18}/><span><strong>Prototype connection</strong><small>Bank authorization will be added when a secure banking provider is connected.</small></span></div>
    {linked.length > 0 && <div className="linked-bank-list">{linked.map((item,index)=><article className="linked-bank-card" key={`${item.bank}-${index}`}><span className="linked-bank-icon"><Icon name="card"/></span><div><strong>{item.bank}</strong><small>{country} · Account ending {item.account}</small></div><button className="button button-secondary button-small" onClick={()=>remove(index)}>Remove</button></article>)}</div>}
    <form className="settings-form bank-link-form" onSubmit={connect}><label>Bank<select required value={bank} onChange={event=>setBank(event.target.value)}><option value="">Choose your bank</option>{(banksByCountry[country] || ["Ecobank", "Access Bank", "UBA"]).map(item=><option key={item}>{item}</option>)}</select></label><label>Account number<input required inputMode="numeric" value={accountNumber} onChange={event=>setAccountNumber(event.target.value.replace(/\D/g, "").slice(0,16))} placeholder="Enter account number" minLength={8}/></label><button className="button button-primary" type="submit"><Icon name="plus"/> Link bank</button></form>
  </div>;
}
function SecuritySettings({ onSaved }: { onSaved: (notice: string) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [twoStep, setTwoStep] = useState(
    () => localStorage.getItem("settle-demo-two-step") === "true",
  );
  const [error, setError] = useState("");
  const savePassword = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!current || !next || !confirm) {
      setError("Complete all password fields.");
      return;
    }
    if (next.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (next !== confirm) {
      setError("The new passwords do not match.");
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    onSaved("Password change saved for this prototype session only.");
  };
  const toggleTwoStep = () => {
    const value = !twoStep;
    setTwoStep(value);
    localStorage.setItem("settle-demo-two-step", String(value));
    onSaved(
      `Two-step verification ${value ? "enabled" : "disabled"} in this prototype.`,
    );
  };
  return (
    <div className="settings-content">
      <div className="setting-card">
        <div className="setting-copy">
          <span className="setting-icon">
            <Icon name="shield" />
          </span>
          <div>
            <strong>Two-step verification</strong>
            <p>
              Add another step when signing in to help protect your account.
            </p>
          </div>
        </div>
        <button
          className={`toggle ${twoStep ? "on" : ""}`}
          role="switch"
          aria-checked={twoStep}
          aria-label="Toggle two-step verification"
          onClick={toggleTwoStep}
        >
          <i />
        </button>
      </div>
      <form className="settings-form" onSubmit={savePassword}>
        <div className="settings-section-title">
          <h3>Change password</h3>
          <p>Choose a strong password you don’t use elsewhere.</p>
        </div>
        <label>
          Current password
          <input
            type="password"
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        <label>
          New password
          <input
            type="password"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        {error && <div className="notice error-notice">{error}</div>}
        <button className="button button-primary" type="submit">
          Update password
        </button>
        <p className="prototype-caption">
          Password changes are not sent to a server in this prototype.
        </p>
      </form>
    </div>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState<Record<string, boolean>>(() =>
    JSON.parse(
      localStorage.getItem("settle-demo-notifications") ||
        '{"transferUpdates":true,"securityAlerts":true,"productNews":false}',
    ),
  );
  const options: [keyof typeof settings, string, string][] = [
    [
      "transferUpdates",
      "Transfer updates",
      "Get updates when a transfer status changes.",
    ],
    [
      "securityAlerts",
      "Security alerts",
      "Know when important account activity happens.",
    ],
    [
      "productNews",
      "Product news",
      "Hear about new features and service updates.",
    ],
  ];
  const toggle = (key: keyof typeof settings) =>
    setSettings((current) => {
      const next = { ...current, [key]: !current[key] };
      localStorage.setItem("settle-demo-notifications", JSON.stringify(next));
      return next;
    });
  return (
    <div className="settings-content">
      <div className="settings-section-title">
        <h3>Notification preferences</h3>
        <p>These preferences are saved on this device for the prototype.</p>
      </div>
      {options.map(([key, title, description]) => (
        <div className="setting-card" key={key}>
          <div className="setting-copy">
            <span className="setting-icon">
              <Icon name={key === "securityAlerts" ? "shield" : "bell"} />
            </span>
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          </div>
          <button
            className={`toggle ${settings[key] ? "on" : ""}`}
            role="switch"
            aria-checked={settings[key]}
            aria-label={`Toggle ${title}`}
            onClick={() => toggle(key)}
          >
            <i />
          </button>
        </div>
      ))}
    </div>
  );
}

function HelpSupport({ onNotice }: { onNotice: (notice: string) => void }) {
  const [topic, setTopic] = useState("Transfer question");
  const [message, setMessage] = useState("");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    setMessage("");
    onNotice(
      "Your support request was saved as a prototype example. No message was sent.",
    );
  };
  return (
    <div className="settings-content">
      <div className="support-banner">
        <span className="support-mark">?</span>
        <div>
          <strong>How can we help?</strong>
          <p>
            Tell us what you need help with and we’ll guide you to the right
            place.
          </p>
        </div>
      </div>
      <div className="support-topics">
        <button
          onClick={() => setTopic("Transfer question")}
          className={topic === "Transfer question" ? "selected" : ""}
        >
          <Icon name="send" />
          <span>
            <strong>Transfer question</strong>
            <small>Rates, fees, and transfer progress</small>
          </span>
          <Icon name="chevron" size={15} />
        </button>
        <button
          onClick={() => setTopic("Account help")}
          className={topic === "Account help" ? "selected" : ""}
        >
          <Icon name="user" />
          <span>
            <strong>Account help</strong>
            <small>Sign-in, profile, or verification</small>
          </span>
          <Icon name="chevron" size={15} />
        </button>
      </div>
      <form className="settings-form" onSubmit={submit}>
        <label>
          What do you need help with?
          <select
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
          >
            <option>Transfer question</option>
            <option>Account help</option>
            <option>Something else</option>
          </select>
        </label>
        <label>
          Message
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="Describe what you need help with"
          />
        </label>
        <button className="button button-primary" type="submit">
          Prepare support request <span>→</span>
        </button>
        <p className="prototype-caption">
          This prototype will not send your message.
        </p>
      </form>
    </div>
  );
}

export default App;
