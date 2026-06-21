import cron from "node-cron";
import { Telegraf } from "telegraf";
import { Types } from "mongoose";
import { getAllUsers } from "../services/userService";
import { generateMonthlyRecap } from "../services/recapService";
import { formatRupiah } from "../utils/formatCurrency";
import { formatDate } from "../utils/dateHelper";
import { BotContext } from "../bot/context";
import { env } from "../config/env";

/**
 * Berjalan setiap tanggal 1 jam 07:00, mengirim rekap bulan sebelumnya
 * ke semua user yang terdaftar secara otomatis.
 */
export function scheduleMonthlyRecap(bot: Telegraf<BotContext>): void {
  cron.schedule(
    "0 7 1 * *",
    async () => {
      try {
        await sendMonthlyRecapToAllUsers(bot);
      } catch (error) {
        console.error("Gagal mengirim rekap bulanan otomatis:", error);
      }
    },
    {
      timezone: env.timezone,
    }
  );
}

async function sendMonthlyRecapToAllUsers(
  bot: Telegraf<BotContext>
): Promise<void> {
  const users = await getAllUsers();

  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);

  const monthInput = `${String(previousMonth.getMonth() + 1).padStart(
    2,
    "0"
  )}-${previousMonth.getFullYear()}`;

  for (const user of users) {
    const recap = await generateMonthlyRecap(
      user._id as Types.ObjectId,
      monthInput
    );

    const walletLines = recap.balancesByWallet.flatMap((item) => [
      `*${item.walletName}*`,
      ...item.ownerBalances.map(
        (owner) => `  ${owner.ownerName}: ${formatRupiah(owner.balance)}`
      ),
    ]);

    const debtLines = recap.activeDebts.map(
      (debt) =>
        `• ke ${debt.counterpartyName}: ${formatRupiah(
          debt.remainingAmount
        )}${debt.dueDate ? ` (jatuh tempo ${formatDate(debt.dueDate)})` : ""}`
    );

    const message = [
      `📊 *Rekap Otomatis - ${recap.monthLabel}*`,
      "",
      `Total Pemasukan: ${formatRupiah(recap.totalIncome)}`,
      `Total Pengeluaran: ${formatRupiah(recap.totalExpense)}`,
      `Selisih: ${formatRupiah(recap.totalIncome - recap.totalExpense)}`,
      "",
      "*Saldo per Dompet*",
      walletLines.length > 0 ? walletLines.join("\n") : "_Belum ada dompet_",
      "",
      "*Hutang Aktif*",
      debtLines.length > 0 ? debtLines.join("\n") : "_Tidak ada_",
    ].join("\n");

    try {
      await bot.telegram.sendMessage(user.telegramId, message, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error(`Gagal kirim rekap ke ${user.telegramId}:`, error);
    }
  }
}
