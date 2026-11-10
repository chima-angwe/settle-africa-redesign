import { SendMoney, type SendMoneyProps } from "@/features/send-money";
import { TransferCalculator } from "@/widgets/transfer-calculator";

export function SendMoneyPage(props: SendMoneyProps) {
  return <SendMoney {...props} aside={<TransferCalculator />} />;
}
