import { Schema, model, Document, Types } from "mongoose";

export interface DebtPaymentDocument extends Document {
  debtId: Types.ObjectId;
  recordedByUserId: Types.ObjectId;
  walletId: Types.ObjectId;
  ownerName: string;
  amount: number;
  date: Date;
}

const debtPaymentSchema = new Schema<DebtPaymentDocument>({
  debtId: {
    type: Schema.Types.ObjectId,
    ref: "Debt",
    required: true,
    index: true,
  },
  recordedByUserId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  walletId: {
    type: Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: () => new Date(),
  },
});

export const DebtPaymentModel = model<DebtPaymentDocument>(
  "DebtPayment",
  debtPaymentSchema
);
