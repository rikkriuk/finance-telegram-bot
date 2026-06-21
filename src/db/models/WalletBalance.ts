import { Schema, model, Document, Types } from "mongoose";

export interface WalletBalanceDocument extends Document {
  walletId: Types.ObjectId;
  ownerName: string;
  balance: number;
  updatedAt: Date;
}

const walletBalanceSchema = new Schema<WalletBalanceDocument>({
  walletId: {
    type: Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: () => new Date(),
  },
});

walletBalanceSchema.index(
  {
    walletId: 1,
    ownerName: 1,
  },
  {
    unique: true,
  }
);

export const WalletBalanceModel = model<WalletBalanceDocument>(
  "WalletBalance",
  walletBalanceSchema
);
