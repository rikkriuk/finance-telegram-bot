import { Schema, model, Document } from "mongoose";

export interface WalletDocument extends Document {
  name: string;
  owners: string[];
  createdAt: Date;
}

const walletSchema = new Schema<WalletDocument>({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  owners: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

export const WalletModel = model<WalletDocument>("Wallet", walletSchema);
