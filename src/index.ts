import { connectDatabase } from "./db/connection";
import { createBot } from "./bot/bot";
import { scheduleDebtReminder } from "./jobs/debtReminderCron";
import { scheduleMonthlyRecap } from "./jobs/monthlyRecapCron";

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const bot = createBot();

  scheduleDebtReminder(bot);
  scheduleMonthlyRecap(bot);

  await bot.launch();

  console.log("🤖 Bot berhasil berjalan");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

bootstrap().catch((error) => {
  console.error("Gagal menjalankan bot:", error);
  process.exit(1);
});
