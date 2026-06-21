import cron from "node-cron";
import { Telegraf } from "telegraf";
import { Types } from "mongoose";
import { DebtModel } from "../db/models/Debt";
import { DebtKind, DebtStatus } from "../types";
import { formatRupiah } from "../utils/formatCurrency";
import { formatDate } from "../utils/dateHelper";
import { UserModel } from "../db/models/User";
import { BotContext } from "../bot/context";
import { env } from "../config/env";

/**
 * Berjalan tiap hari jam 08:00, mengirim reminder untuk tagihan
 * (termasuk SPayLater) yang jatuh tempo dalam 3 hari ke depan.
 */
export function scheduleDebtReminder(bot: Telegraf<BotContext>): void {
  cron.schedule(
    "0 8 * * *",
    async () => {
      try {
        await sendDueReminders(bot);
      } catch (error) {
        console.error("Gagal mengirim reminder hutang:", error);
      }
    },
    {
      timezone: env.timezone,
    }
  );
}

async function sendDueReminders(bot: Telegraf<BotContext>): Promise<void> {
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const dueDebts = await DebtModel.find({
    kind: DebtKind.DEBT,
    status: {
      $ne: DebtStatus.PAID,
    },
    dueDate: {
      $gte: now,
      $lte: threeDaysLater,
    },
  });

  for (const debt of dueDebts) {
    const user = await UserModel.findById(debt.userId as Types.ObjectId);

    if (!user) {
      continue;
    }

    const message = [
      "⏰ *Reminder Tagihan*",
      `${debt.counterpartyName}: ${formatRupiah(debt.remainingAmount)}`,
      debt.dueDate ? `Jatuh tempo: ${formatDate(debt.dueDate)}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    await bot.telegram.sendMessage(user.telegramId, message, {
      parse_mode: "Markdown",
    });
  }
}
