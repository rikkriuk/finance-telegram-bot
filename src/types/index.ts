export enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense",
  DEBT_PAYMENT = "debt_payment",
  RECEIVABLE_PAYMENT = "receivable_payment",
}

export enum DebtKind {
  DEBT = "debt",
  RECEIVABLE = "receivable",
}

export enum DebtStatus {
  UNPAID = "unpaid",
  PARTIAL = "partial",
  PAID = "paid",
}

/**
 * Label default dipakai saat saldo/transaksi tidak disebutkan
 * kepemilikannya secara spesifik.
 */
export const UNNAMED_OWNER = "Tanpa Nama";

export interface RecordTransactionInput {
  telegramId: number;
  walletId: string;
  ownerName: string;
  amount: number;
  category?: string;
  note?: string;
}

export interface CreateDebtInput {
  telegramId: number;
  counterpartyName: string;
  amount: number;
  note?: string;
  isRecurring?: boolean;
  recurrenceDay?: number;
  dueDate?: Date;
}

export interface PayDebtInput {
  telegramId: number;
  debtId: string;
  amount: number;
  walletId: string;
  ownerName: string;
}

export interface OwnerBalanceSummary {
  ownerName: string;
  balance: number;
}

export interface WalletBalanceSummary {
  walletName: string;
  ownerBalances: OwnerBalanceSummary[];
  walletTotalBalance: number;
}

export interface MonthlyRecap {
  monthLabel: string;
  totalIncome: number;
  totalExpense: number;
  balancesByWallet: WalletBalanceSummary[];
  activeDebts: DebtSummaryItem[];
  activeReceivables: DebtSummaryItem[];
}

export interface DebtSummaryItem {
  id: string;
  counterpartyName: string;
  remainingAmount: number;
  status: DebtStatus;
  dueDate?: Date;
  isRecurring: boolean;
}

/**
 * State sementara yang dipakai wizard "buat wallet baru".
 */
export interface CreateWalletWizardState {
  walletName?: string;
  ownerCount?: number;
  owners: string[];
}

/**
 * State sementara yang dipakai wizard "catat transaksi" (income/expense).
 */
export interface TransactionWizardState {
  transactionType?: TransactionType.INCOME | TransactionType.EXPENSE;
  walletId?: string;
  walletName?: string;
  ownerName?: string;
  amount?: number;
  category?: string;
  note?: string;
}

/**
 * State sementara yang dipakai wizard "bayar hutang / terima piutang".
 */
export interface DebtPaymentWizardState {
  kind?: DebtKind;
  debtId?: string;
  counterpartyName?: string;
  walletId?: string;
  walletName?: string;
  ownerName?: string;
  amount?: number;
}
