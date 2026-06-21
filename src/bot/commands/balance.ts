import { Types } from "mongoose";
import { BotContext } from "../context";
import {
  listWallets,
  getBalancesByWallet,
  getWalletTotalBalance,
} from "../../services/walletService";
import { formatRupiah } from "../../utils/formatCurrency";

export async function balanceCommand(ctx: BotContext): Promise<void> {
  const wallets = await listWallets();

  if (wallets.length === 0) {
    await ctx.reply("Belum ada wallet & transaksi tercatat.");
    return;
  }

  const lines: string[] = [];

  for (const wallet of wallets) {
    const ownerRows = await getBalancesByWallet(wallet._id as Types.ObjectId);
    const totalBalance = await getWalletTotalBalance(
      wallet._id as Types.ObjectId
    );

    lines.push(`*${wallet.name}*`);

    if (ownerRows.length === 0) {
      lines.push("  _Belum ada transaksi_");
    } else {
      for (const row of ownerRows) {
        lines.push(`  ${row.ownerName}: ${formatRupiah(row.balance)}`);
      }
    }

    lines.push(`  Total: ${formatRupiah(totalBalance)}`, "");
  }

  await ctx.reply(["💰 *Saldo per Wallet*", "", ...lines].join("\n"), {
    parse_mode: "Markdown",
  });
}
