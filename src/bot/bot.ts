import { Telegraf, session } from "telegraf";
import { env } from "../config/env";
import { BotContext } from "./context";
import { ensureUser } from "./middlewares/ensureUser";
import { createStage } from "./scenes";
import { BOT_COMMAND_LIST, SCENE_IDS } from "../config/constants";
import { startCommand, helpCommand } from "./commands/start";
import { walletsCommand } from "./commands/wallet";
import { balanceCommand } from "./commands/balance";
import { recapCommand } from "./commands/recap";
import { TransactionType } from "../types";

export async function createBot(): Promise<Telegraf<BotContext>> {
  const bot = new Telegraf<BotContext>(env.botToken);
  const stage = createStage();

  await bot.telegram.setMyCommands(BOT_COMMAND_LIST);

  bot.use(session());
  bot.use(ensureUser);
  bot.use(stage.middleware());

  bot.start(startCommand);
  bot.help(helpCommand);

  bot.command("wallets", walletsCommand);
  bot.command("tambahwallet", (ctx) => ctx.scene.enter(SCENE_IDS.createWallet));

  bot.command("masuk", (ctx) =>
    ctx.scene.enter(SCENE_IDS.addTransaction, {
      data: {
        transactionType: TransactionType.INCOME,
      },
    })
  );
  bot.command("keluar", (ctx) =>
    ctx.scene.enter(SCENE_IDS.addTransaction, {
      data: {
        transactionType: TransactionType.EXPENSE,
      },
    })
  );

  bot.command("saldo", balanceCommand);

  // bot.command("berhutang", addDebtCommand);
  // bot.command("piutang", addReceivableCommand);
  // bot.command("bayarhutang", (ctx) =>
  //   ctx.scene.enter(SCENE_IDS.payDebt, {
  //     data: {
  //       kind: DebtKind.DEBT,
  //     },
  //   })
  // );
  // bot.command("tagihpiutang", (ctx) =>
  //   ctx.scene.enter(SCENE_IDS.payDebt, {
  //     data: {
  //       kind: DebtKind.RECEIVABLE,
  //     },
  //   })
  // );
  // bot.command("hutangku", listDebtsCommand);

  // bot.command("spaylatersetup", spaylaterSetupCommand);
  // bot.command("spaylaterbayar", spaylaterPayTrigger);

  bot.command("rekap", recapCommand);

  bot.catch((error, ctx) => {
    console.error("Bot error:", error);
    ctx.reply("⚠️ Terjadi kesalahan saat memproses perintah kamu.");
  });

  return bot;
}
