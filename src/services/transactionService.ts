import { Types } from "mongoose";
import { TransactionModel, TransactionDocument } from "../db/models/Transaction";
import { TransactionType, RecordTransactionInput } from "../types";
import { findOrCreateUser } from "./userService";
import { findWalletById, adjustOwnerBalance } from "./walletService";

interface RecordResult {
  transaction: TransactionDocument;
  newBalance: number;
}

export async function recordIncome(
  input: RecordTransactionInput
): Promise<RecordResult> {
  return recordTransaction(input, TransactionType.INCOME, input.amount);
}

export async function recordExpense(
  input: RecordTransactionInput
): Promise<RecordResult> {
  return recordTransaction(input, TransactionType.EXPENSE, -input.amount);
}

async function recordTransaction(
  input: RecordTransactionInput,
  type: TransactionType,
  signedAmount: number
): Promise<RecordResult> {
  const user = await findOrCreateUser(input.telegramId, "Pengguna");

  const wallet = await findWalletById(input.walletId);
  if (!wallet) {
    throw new Error(`Wallet tidak ditemukan`);
  }

  const balanceRow = await adjustOwnerBalance(
    wallet._id as Types.ObjectId,
    input.ownerName,
    signedAmount
  );

  const transaction = await TransactionModel.create({
    recordedByUserId: user._id,
    walletId: wallet._id,
    ownerName: input.ownerName,
    type,
    amount: Math.abs(input.amount),
    category: input.category,
    note: input.note,
  });

  return {
    transaction,
    newBalance: balanceRow.balance,
  };
}

export async function getTransactionsInRange(
  start: Date,
  end: Date
): Promise<TransactionDocument[]> {
  return TransactionModel.find({
    date: {
      $gte: start,
      $lte: end,
    },
  }).sort({
    date: 1,
  });
}
