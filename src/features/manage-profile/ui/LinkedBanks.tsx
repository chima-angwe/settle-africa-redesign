import type React from 'react';
import { useState } from 'react';
import { Icon } from '@/shared/ui';

export interface LinkedBanksProps {
  country: string;
  onNotice: (message: string) => void;
}

export function LinkedBanks({ country, onNotice }: { country: string; onNotice: (message: string) => void }) {
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