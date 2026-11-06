import { useState } from 'react';
import { Icon, PageHeading } from '@/shared/ui';
import type { Page } from '@/shared/types';
import type { Recipient } from '@/entities/recipient';
import type { Transfer } from '@/entities/transfer';
import { CountryBadge, CountryFlag, CountrySelect, countryFlag, payoutProviders, callingCodes } from '@/entities/country';

export interface SendMoneyProps {
  recipients: Recipient[];
  targetRecipientId: number | null;
  defaultCountry: string;
  setTargetRecipientId: (id: number | null) => void;
  setRecipients: (items: Recipient[]) => void;
  transfers: Transfer[];
  setTransfers: (items: Transfer[]) => void;
  setPage: (page: Page) => void;
}

export function SendMoney({
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