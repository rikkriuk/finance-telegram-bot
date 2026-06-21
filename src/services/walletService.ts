import { Types } from "mongoose";
import { WalletModel, WalletDocument } from "../db/models/Wallet";
import {
  WalletBalanceModel,
  WalletBalanceDocument,
} from "../db/models/WalletBalance";
import { UNNAMED_OWNER } from "../types";

export async function createWalletWithOwners(
  name: string,
  owners: string[]
): Promise<WalletDocument> {
  const normalizedName = name.trim();

  const existing = await WalletModel.findOne({
    name: new RegExp(`^${normalizedName}$`, "i"),
  });

  if (existing) {
    throw new Error(`Wallet "${normalizedName}" sudah ada`);
  }

  const created = await WalletModel.create({
    name: normalizedName,
    owners,
  });

  return created;
}

export async function findWalletByName(
  name: string
): Promise<WalletDocument | null> {
  return WalletModel.findOne({
    name: new RegExp(`^${name.trim()}$`, "i"),
  });
}

export async function findWalletById(
  walletId: string | Types.ObjectId
): Promise<WalletDocument | null> {
  return WalletModel.findById(walletId);
}

export async function listWallets(): Promise<WalletDocument[]> {
  return WalletModel.find().sort({
    name: 1,
  });
}

export async function addOwnerToWallet(
  walletId: Types.ObjectId,
  ownerName: string
): Promise<WalletDocument | null> {
  return WalletModel.findByIdAndUpdate(
    walletId,
    {
      $addToSet: {
        owners: ownerName,
      },
    },
    {
      new: true,
    }
  );
}

/**
 * Daftar nama pemilik suatu wallet, ditambah opsi "Tanpa Nama"
 * untuk transaksi yang tidak disebutkan kepemilikannya.
 */
export function listOwnersWithUnnamedOption(
  wallet: WalletDocument
): string[] {
  return [...wallet.owners, UNNAMED_OWNER];
}

export async function getOrCreateOwnerBalance(
  walletId: Types.ObjectId,
  ownerName: string
): Promise<WalletBalanceDocument> {
  const existing = await WalletBalanceModel.findOne({
    walletId,
    ownerName,
  });

  if (existing) {
    return existing;
  }

  const created = await WalletBalanceModel.create({
    walletId,
    ownerName,
    balance: 0,
  });

  return created;
}

export async function adjustOwnerBalance(
  walletId: Types.ObjectId,
  ownerName: string,
  delta: number
): Promise<WalletBalanceDocument> {
  const updated = await WalletBalanceModel.findOneAndUpdate(
    {
      walletId,
      ownerName,
    },
    {
      $inc: {
        balance: delta,
      },
      $set: {
        updatedAt: new Date(),
      },
    },
    {
      new: true,
      upsert: true,
    }
  );

  return updated as WalletBalanceDocument;
}

export async function getWalletTotalBalance(
  walletId: Types.ObjectId
): Promise<number> {
  const rows = await WalletBalanceModel.find({
    walletId,
  });

  return rows.reduce((sum, row) => sum + row.balance, 0);
}

export async function getBalancesByWallet(
  walletId: Types.ObjectId
): Promise<WalletBalanceDocument[]> {
  return WalletBalanceModel.find({
    walletId,
  }).sort({
    ownerName: 1,
  });
}
