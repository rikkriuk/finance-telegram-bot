import { UserModel, UserDocument } from "../db/models/User";

export async function findOrCreateUser(
  telegramId: number,
  name: string,
  username?: string
): Promise<UserDocument> {
  const existing = await UserModel.findOne({
    telegramId,
  });

  if (existing) {
    return existing;
  }

  const created = await UserModel.create({
    telegramId,
    name,
    username,
  });

  return created;
}

export async function getAllUsers(): Promise<UserDocument[]> {
  return UserModel.find();
}
