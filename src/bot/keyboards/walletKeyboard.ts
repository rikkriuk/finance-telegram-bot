import { Markup } from "telegraf";
import { WalletDocument } from "../../db/models/Wallet";

export function buildWalletKeyboard(wallets: WalletDocument[]) {
  const buttons = wallets.map((wallet) =>
    Markup.button.callback(wallet.name, `wallet:${wallet._id}`)
  );

  return Markup.inlineKeyboard(buttons, {
    columns: 2,
  });
}
