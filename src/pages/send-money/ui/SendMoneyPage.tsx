import {
  SendMoney,
  type SendMoneyProps,
} from "@/features/send-money";
import { TransferCalculator } from "@/widgets/transfer-calculator";

export function SendMoneyPage(props: SendMoneyProps) {
  return (
    <SendMoney
      {...props}
      aside={(flow) => (
        <TransferCalculator
          amount={flow.amount}
          onAmountChange={flow.setAmount}
          fromCountry={flow.sendCountry}
          onFromCountryChange={(country, currency) => {
            flow.setSendCountry(country);
            flow.setSendCurrency(currency);
          }}
          toCountry={flow.targetCountry}
          onToCountryChange={(country) => flow.setTargetCountry(country)}
          fromCountries={flow.supportedCountries}
          toCountries={flow.supportedCountries}
          ratesMap={flow.localeRatesMap}
          currencyByCountry={flow.currencyByCountry}
          isoByCountry={flow.isoByCountry}
          onSwap={flow.swapCountries}
          feeAmount={flow.calculation.feeAmount}
          totalDebit={flow.calculation.totalDebit}
        />
      )}
    />
  );
}
