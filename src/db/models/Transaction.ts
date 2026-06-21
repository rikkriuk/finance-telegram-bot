import { Schema, model, Document, Types } from "mongoose";
import { TransactionType } from "../../types";

export interface TransactionDocument extends Document {
  recordedByUserId: Types.ObjectId;
  walletId: Types.ObjectId;
  ownerName: string;
  type: TransactionType;
  amount: number;
  category?: string;
  note?: string;
  relatedDebtId?: Types.ObjectId;
  date: Date;
}

const transactionSchema = new Schema<TransactionDocument>({
  recordedByUserId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  walletId: {
    type: Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
    index: true,
  },
  ownerName: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: Object.values(TransactionType),
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
  },
  note: {
    type: String,
  },
  relatedDebtId: {
    type: Schema.Types.ObjectId,
    ref: "Debt",
  },
  date: {
    type: Date,
    default: () => new Date(),
    index: true,
  },
});

export const TransactionModel = model<TransactionDocument>(
  "Transaction",
  transactionSchema
);
