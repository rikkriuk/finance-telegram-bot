import { Schema, model, Document } from "mongoose";

export interface UserDocument extends Document {
  telegramId: number;
  name: string;
  username?: string;
  createdAt: Date;
}

const userSchema = new Schema<UserDocument>({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: () => new Date(),
  },
});

export const UserModel = model<UserDocument>("User", userSchema);
