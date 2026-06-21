import { Types } from "mongoose";
import { resolveMonthRange } from "../utils/dateHelper";
import { getTransactionsInRange } from "./transactionService";
import {
  listWallets,
  getBalancesByWallet,
  getWalletTotalBalance,
} from "./walletService";
import { listActiveDebts } from "./debtService";
import {
  TransactionType,
  DebtKind,
  MonthlyRecap,
  DebtSummaryItem,
  WalletBalanceSummary,
} from "../types";

export async function generateMonthlyRecap(
  userId: Types.ObjectId,
  monthInput?: string
): Promise<MonthlyRecap> {
  const range = resolveMonthRange(monthInput);

  const transactions = await getTransactionsInRange(range.start, range.end);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const trx of transactions) {
    if (trx.type === TransactionType.INCOME) {
      totalIncome += trx.amount;
    } else if (trx.type === TransactionType.EXPENSE) {
      totalExpense += trx.amount;
    }
  }

  const wallets = await listWallets();
  const balancesByWallet: WalletBalanceSummary[] = [];

  for (const wallet of wallets) {
    const ownerRows = await getBalancesByWallet(wallet._id as Types.ObjectId);
    const walletTotalBalance = await getWalletTotalBalance(
      wallet._id as Types.ObjectId
    );

    balancesByWallet.push({
      walletName: wallet.name,
      ownerBalances: ownerRows.map((row) => ({
        ownerName: row.ownerName,
        balance: row.balance,
      })),
      walletTotalBalance,
    });
  }

  const debts = await listActiveDebts(userId, DebtKind.DEBT);
  const receivables = await listActiveDebts(userId, DebtKind.RECEIVABLE);

  const activeDebts: DebtSummaryItem[] = debts.map((debt) => ({
    id: String(debt._id),
    counterpartyName: debt.counterpartyName,
    remainingAmount: debt.remainingAmount,
    status: debt.status,
    dueDate: debt.dueDate,
    isRecurring: debt.isRecurring,
  }));

  const activeReceivables: DebtSummaryItem[] = receivables.map((debt) => ({
    id: String(debt._id),
    counterpartyName: debt.counterpartyName,
    remainingAmount: debt.remainingAmount,
    status: debt.status,
    dueDate: debt.dueDate,
    isRecurring: debt.isRecurring,
  }));

  return {
    monthLabel: range.label,
    totalIncome,
    totalExpense,
    balancesByWallet,
    activeDebts,
    activeReceivables,
  };
}
