import { Schema, model, Document, Types } from "mongoose";
import { DebtKind, DebtStatus } from "../../types";

export interface DebtDocument extends Document {
  userId: Types.ObjectId;
  kind: DebtKind;
  counterpartyName: string;
  originalAmount: number;
  remainingAmount: number;
  status: DebtStatus;
  note?: string;
  isRecurring: boolean;
  recurrenceDay?: number;
  dueDate?: Date;
  createdAt: Date;
}

const debtSchema = new Schema<DebtDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  kind: {
    type: String,
    enum: Object.values(DebtKind),
    required: true,
  },
  counterpartyName: {
    type: String,
    required: true,
  },
  originalAmount: {
    type: Number,
    required: true,
  },
  remainingAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(DebtStatus),
    default: DebtStatus.UNPAID,
  },
  note: {
    type: String,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurrenceDay: {
    type: Number,
  },
  dueDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

export const DebtModel = model<DebtDocument>("Debt", debtSchema);
