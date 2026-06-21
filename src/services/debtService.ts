import { Types } from "mongoose";
import { DebtModel, DebtDocument } from "../db/models/Debt";
import { DebtPaymentModel } from "../db/models/DebtPayment";
import { TransactionModel } from "../db/models/Transaction";
import {
  CreateDebtInput,
  PayDebtInput,
  DebtKind,
  DebtStatus,
  TransactionType,
} from "../types";
import { findOrCreateUser } from "./userService";
import { findWalletById, adjustOwnerBalance } from "./walletService";
import { SPAYLATER_WALLET_NAME } from "../config/constants";
import { nextDueDateThisOrNextMonth } from "../utils/dateHelper";

export async function createDebt(
  input: CreateDebtInput,
  kind: DebtKind
): Promise<DebtDocument> {
  const user = await findOrCreateUser(input.telegramId, "Pengguna");

  const debt = await DebtModel.create({
    userId: user._id,
    kind,
    counterpartyName: input.counterpartyName,
    originalAmount: input.amount,
    remainingAmount: input.amount,
    status: DebtStatus.UNPAID,
    note: input.note,
    isRecurring: input.isRecurring || false,
    recurrenceDay: input.recurrenceDay,
    dueDate: input.dueDate,
  });

  return debt;
}

export async function setupSpaylater(
  telegramId: number,
  amount: number,
  dueDay: number
): Promise<DebtDocument> {
  return createDebt(
    {
      telegramId,
      counterpartyName: SPAYLATER_WALLET_NAME,
      amount,
      isRecurring: true,
      recurrenceDay: dueDay,
      dueDate: nextDueDateThisOrNextMonth(dueDay),
      note: "Tagihan bulanan SPayLater",
    },
    DebtKind.DEBT
  );
}

export async function findActiveSpaylaterDebt(
  userId: Types.ObjectId
): Promise<DebtDocument | null> {
  return DebtModel.findOne({
    userId,
    counterpartyName: SPAYLATER_WALLET_NAME,
    isRecurring: true,
    status: {
      $ne: DebtStatus.PAID,
    },
  }).sort({
    createdAt: -1,
  });
}

interface PayResult {
  debt: DebtDocument;
  remainingWalletBalance: number;
}

export async function payDebtOrReceivable(
  input: PayDebtInput,
  kind: DebtKind
): Promise<PayResult> {
  const user = await findOrCreateUser(input.telegramId, "Pengguna");

  const debt = await DebtModel.findOne({
    _id: input.debtId,
    userId: user._id,
    kind,
  });

  if (!debt) {
    throw new Error("Data hutang/piutang tidak ditemukan");
  }

  if (input.amount > debt.remainingAmount) {
    throw new Error(
      `Jumlah pembayaran melebihi sisa tagihan (sisa: ${debt.remainingAmount})`
    );
  }

  const wallet = await findWalletById(input.walletId);
  if (!wallet) {
    throw new Error("Wallet tidak ditemukan");
  }

  // Jika ini hutang (kita bayar ke orang lain), saldo pemilik berkurang.
  // Jika ini piutang (orang lain bayar ke kita), saldo pemilik bertambah.
  const balanceDelta = kind === DebtKind.DEBT ? -input.amount : input.amount;

  const balanceRow = await adjustOwnerBalance(
    wallet._id as Types.ObjectId,
    input.ownerName,
    balanceDelta
  );

  debt.remainingAmount -= input.amount;
  debt.status =
    debt.remainingAmount <= 0 ? DebtStatus.PAID : DebtStatus.PARTIAL;

  // Hutang SPayLater bersifat berulang: kalau lunas, siapkan tagihan bulan depan.
  if (
    debt.status === DebtStatus.PAID &&
    debt.isRecurring &&
    debt.recurrenceDay
  ) {
    await DebtModel.create({
      userId: debt.userId,
      kind: debt.kind,
      counterpartyName: debt.counterpartyName,
      originalAmount: debt.originalAmount,
      remainingAmount: debt.originalAmount,
      status: DebtStatus.UNPAID,
      note: debt.note,
      isRecurring: true,
      recurrenceDay: debt.recurrenceDay,
      dueDate: nextDueDateThisOrNextMonth(debt.recurrenceDay),
    });
  }

  await debt.save();

  await DebtPaymentModel.create({
    debtId: debt._id,
    recordedByUserId: user._id,
    walletId: wallet._id,
    ownerName: input.ownerName,
    amount: input.amount,
  });

  await TransactionModel.create({
    recordedByUserId: user._id,
    walletId: wallet._id,
    ownerName: input.ownerName,
    type:
      kind === DebtKind.DEBT
        ? TransactionType.DEBT_PAYMENT
        : TransactionType.RECEIVABLE_PAYMENT,
    amount: input.amount,
    category: kind === DebtKind.DEBT ? "bayar hutang" : "terima piutang",
    note: `${debt.counterpartyName}`,
    relatedDebtId: debt._id,
  });

  return {
    debt,
    remainingWalletBalance: balanceRow.balance,
  };
}

export async function listActiveDebts(
  userId: Types.ObjectId,
  kind: DebtKind
): Promise<DebtDocument[]> {
  return DebtModel.find({
    userId,
    kind,
    status: {
      $ne: DebtStatus.PAID,
    },
  }).sort({
    dueDate: 1,
    createdAt: 1,
  });
}
