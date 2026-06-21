import { Types } from "mongoose";
import { BotContext } from "../context";
import { generateMonthlyRecap } from "../../services/recapService";
import { formatRupiah } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/dateHelper";

export async function recapCommand(ctx: BotContext): Promise<void> {
  const text = "text" in ctx.message! ? ctx.message.text : "";
  const monthInput = text.trim().split(/\s+/)[1];

  const userId = ctx.appUser!._id as Types.ObjectId;
  const recap = await generateMonthlyRecap(userId, monthInput);

  const walletLines: string[] = [];

  for (const wallet of recap.balancesByWallet) {
    walletLines.push(`*${wallet.walletName}*`);

    if (wallet.ownerBalances.length === 0) {
      walletLines.push("  _Belum ada transaksi_");
    } else {
      for (const owner of wallet.ownerBalances) {
        walletLines.push(`  ${owner.ownerName}: ${formatRupiah(owner.balance)}`);
      }
    }

    walletLines.push(`  Total: ${formatRupiah(wallet.walletTotalBalance)}`, "");
  }

  const debtLines = recap.activeDebts.map(
    (debt) =>
      `• ke ${debt.counterpartyName}: ${formatRupiah(debt.remainingAmount)}${
        debt.dueDate ? ` (jatuh tempo ${formatDate(debt.dueDate)})` : ""
      }`
  );

  const receivableLines = recap.activeReceivables.map(
    (debt) => `• dari ${debt.counterpartyName}: ${formatRupiah(debt.remainingAmount)}`
  );

  const message = [
    `📊 *Rekap ${recap.monthLabel}*`,
    "",
    `Total Pemasukan: ${formatRupiah(recap.totalIncome)}`,
    `Total Pengeluaran: ${formatRupiah(recap.totalExpense)}`,
    `Selisih: ${formatRupiah(recap.totalIncome - recap.totalExpense)}`,
    "",
    "*Saldo per Wallet*",
    walletLines.length > 0 ? walletLines.join("\n") : "_Belum ada wallet_",
    "",
    "*Hutang Aktif*",
    debtLines.length > 0 ? debtLines.join("\n") : "_Tidak ada_",
    "",
    "*Piutang Aktif*",
    receivableLines.length > 0 ? receivableLines.join("\n") : "_Tidak ada_",
  ].join("\n");

  await ctx.reply(message, {
    parse_mode: "Markdown",
  });
}
